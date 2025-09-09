import { useState } from "react";
import LandingPage from "@/components/LandingPage";
import AuthModal from "@/components/AuthModal";
import { SupabaseConnectionTest } from "@/components/SupabaseConnectionTest";

const Index = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
      <LandingPage onOpenAuth={() => setShowAuthModal(true)} />
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
      <div className="fixed bottom-4 right-4">
        <SupabaseConnectionTest />
      </div>
    </>
  );
};

export default Index;
