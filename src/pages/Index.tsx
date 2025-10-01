import { useState } from "react";
import LandingPage from "@/components/LandingPage";
import AuthModal from "@/components/AuthModal";

const Index = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
      <LandingPage onOpenAuth={() => setShowAuthModal(true)} />
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
};

export default Index;
