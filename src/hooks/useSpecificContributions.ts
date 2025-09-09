import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Campaign {
  campaign_id: string;
  condominium_id: string;
  title: string;
  description: string;
  target_amount: number;
  start_date: string;
  end_date: string;
  campaign_status: string;
  created_at: string;
  total_raised: number;
  total_pending: number;
  remaining_amount: number;
  progress_percentage: number;
  total_contributors: number;
  paid_contributors: number;
  pending_contributors: number;
  paid_contributions_count: number;
  pending_contributions_count: number;
  average_contribution: number;
}

export interface Contribution {
  id: string;
  resident_id: string;
  resident_name: string;
  apartment_number: string;
  amount: number;
  status: string;
  payment_date: string;
  notes: string;
  created_at: string;
}

export interface CampaignReport {
  campaign: Campaign;
  contributions: Contribution[];
}

export interface CampaignFilters {
  campaignId?: string;
  startDate?: string;
  endDate?: string;
  residentId?: string;
  status?: string;
}

export function useSpecificContributions() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignReport, setCampaignReport] = useState<CampaignReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [residents, setResidents] = useState<any[]>([]);
  const { profile } = useAuth();
  const { toast } = useToast();

  // Fetch all campaigns
  const fetchCampaigns = useCallback(async () => {
    if (!profile?.condominium_id) return;

    try {
      setLoading(true);
      
      // Fetch campaigns with contributions data directly
      const { data: campaignData, error: campaignError } = await supabase
        .from('specific_campaigns')
        .select(`
          *,
          specific_contributions (
            amount,
            status
          )
        `)
        .eq('condominium_id', profile.condominium_id)
        .order('created_at', { ascending: false });

      if (campaignError) throw campaignError;

      // Calculate analytics for each campaign
      const processedCampaigns = (campaignData || []).map(campaign => {
        const contributions = campaign.specific_contributions || [];
        
        const totalRaised = contributions
          .filter(c => c.status === 'paid')
          .reduce((sum, c) => sum + Number(c.amount), 0);
          
        const totalPending = contributions
          .filter(c => c.status === 'pending')
          .reduce((sum, c) => sum + Number(c.amount), 0);
          
        const remainingAmount = Number(campaign.target_amount) - totalRaised;
        const progressPercentage = campaign.target_amount > 0 
          ? Math.round((totalRaised / campaign.target_amount) * 100) 
          : 0;
          
        const paidContributions = contributions.filter(c => c.status === 'paid');
        const pendingContributions = contributions.filter(c => c.status === 'pending');
        
        const totalContributors = contributions.length;
        const paidContributors = paidContributions.length;
        const pendingContributors = pendingContributions.length;
        const averageContribution = paidContributions.length > 0 
          ? totalRaised / paidContributions.length 
          : 0;

        return {
          campaign_id: campaign.id,
          condominium_id: campaign.condominium_id,
          title: campaign.title,
          description: campaign.description,
          target_amount: Number(campaign.target_amount),
          start_date: campaign.start_date,
          end_date: campaign.end_date,
          campaign_status: campaign.status,
          created_at: campaign.created_at,
          total_raised: totalRaised,
          total_pending: totalPending,
          remaining_amount: remainingAmount,
          progress_percentage: progressPercentage,
          total_contributors: totalContributors,
          paid_contributors: paidContributors,
          pending_contributors: pendingContributors,
          paid_contributions_count: paidContributions.length,
          pending_contributions_count: pendingContributions.length,
          average_contribution: averageContribution,
        };
      });

      setCampaigns(processedCampaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar campanhas de contribuição.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [profile?.condominium_id, toast]);

  // Fetch detailed campaign report
  const fetchCampaignReport = useCallback(async (campaignId: string) => {
    if (!profile?.condominium_id || !campaignId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_campaign_report', {
        _campaign_id: campaignId,
        _condominium_id: profile.condominium_id
      });

      if (error) throw error;
      
      // Type cast the response properly - RPC returns Json type
      const reportData = data as unknown as CampaignReport | null;
      setCampaignReport(reportData);
    } catch (error) {
      console.error('Error fetching campaign report:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar relatório da campanha.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [profile?.condominium_id, toast]);

  // Fetch residents for autocomplete
  const fetchResidents = useCallback(async () => {
    if (!profile?.condominium_id) return;

    try {
      const { data, error } = await supabase
        .from('residents')
        .select(`
          id,
          apartment_number,
          profile_id,
          profiles!inner (
            first_name,
            last_name
          )
        `)
        .eq('condominium_id', profile.condominium_id);

      if (error) throw error;
      setResidents(data || []);
    } catch (error) {
      console.error('Error fetching residents:', error);
    }
  }, [profile?.condominium_id]);

  // Configure realtime subscriptions for campaigns
  useEffect(() => {
    if (!profile?.condominium_id) return;

    const campaignChannel = supabase
      .channel(`campaigns-${profile.condominium_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'specific_campaigns',
          filter: `condominium_id=eq.${profile.condominium_id}`,
        },
        (payload) => {
          console.log('Campaign data changed:', payload);
          fetchCampaigns();
        }
      )
      .subscribe((status) => {
        console.log('Campaign channel status:', status);
      });

    return () => {
      supabase.removeChannel(campaignChannel);
    };
  }, [profile?.condominium_id, fetchCampaigns]);

  // Configure realtime subscriptions for contributions
  useEffect(() => {
    if (!profile?.condominium_id) return;

    const contributionChannel = supabase
      .channel(`contributions-${profile.condominium_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'specific_contributions',
          filter: `condominium_id=eq.${profile.condominium_id}`,
        },
        (payload) => {
          console.log('Contribution data changed:', payload);
          fetchCampaigns();
          if (selectedCampaign) {
            fetchCampaignReport(selectedCampaign.campaign_id);
          }
        }
      )
      .subscribe((status) => {
        console.log('Contribution channel status:', status);
      });

    return () => {
      supabase.removeChannel(contributionChannel);
    };
  }, [profile?.condominium_id, selectedCampaign, fetchCampaigns, fetchCampaignReport]);

  // Create new campaign
  const createCampaign = async (campaignData: {
    title: string;
    description?: string;
    target_amount: number;
    start_date: string;
    end_date?: string;
  }) => {
    if (!profile?.condominium_id || !profile?.user_id) return null;

    try {
      const { data, error } = await supabase
        .from('specific_campaigns')
        .insert({
          ...campaignData,
          condominium_id: profile.condominium_id,
          created_by: profile.user_id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Campanha criada com sucesso.",
      });

      // The realtime subscription will handle the data refresh automatically
      return data;
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar campanha.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Add contribution to campaign
  const addContribution = async (contributionData: {
    campaign_id: string;
    resident_id: string;
    amount: number;
    status?: string;
    payment_date?: string;
    notes?: string;
  }) => {
    if (!profile?.condominium_id) return null;

    try {
      const { data, error } = await supabase
        .from('specific_contributions')
        .insert({
          ...contributionData,
          condominium_id: profile.condominium_id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Contribuição adicionada com sucesso.",
      });

      // The realtime subscriptions will handle the data refresh automatically
      return data;
    } catch (error) {
      console.error('Error adding contribution:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar contribuição.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Update contribution status
  const updateContributionStatus = async (contributionId: string, status: string, paymentDate?: string) => {
    try {
      const updateData: any = { status };
      if (paymentDate) updateData.payment_date = paymentDate;

      const { error } = await supabase
        .from('specific_contributions')
        .update(updateData)
        .eq('id', contributionId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Status da contribuição atualizado.",
      });

      // The realtime subscriptions will handle the data refresh automatically
    } catch (error) {
      console.error('Error updating contribution:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar contribuição.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchResidents();
  }, [fetchCampaigns, fetchResidents]);

  return {
    campaigns,
    selectedCampaign,
    setSelectedCampaign,
    campaignReport,
    residents,
    loading,
    fetchCampaigns,
    fetchCampaignReport,
    createCampaign,
    addContribution,
    updateContributionStatus,
  };
}