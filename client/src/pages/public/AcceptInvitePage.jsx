import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { workspaceService } from '../../services/workspaceService.js';
import { PosterButton } from '../../components/ui/PosterButton.jsx';
import { Users, CheckCircle, AlertCircle } from 'lucide-react';

export function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [error, setError] = useState(null);

  const handleAccept = async () => {
    if (!token) {
      setError('Invitation token is missing from the link.');
      return;
    }

    const authToken = localStorage.getItem('wrapai_token');
    if (!authToken) {
      sessionStorage.setItem('pending_invite_token', token);
      navigate(`/login?redirect=/invite/accept?token=${token}`);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await workspaceService.acceptInvitation(token);
      setResultData(res.data);
      setIsSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to accept invitation. Link may be expired or invalid.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-20 px-6">
      <div className="p-8 sm:p-12 bg-white/70 border border-[#C7C7C7] text-center space-y-8">
        <div className="w-12 h-12 bg-[#141414] text-[#E3E2DE] flex items-center justify-center mx-auto">
          <Users className="w-6 h-6 text-[#1351AA]" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold tracking-[0.2em] text-[#7A7A7A] uppercase block">
            WORKSPACE INVITATION
          </span>
          <h2 className="text-3xl font-black uppercase tracking-tight text-[#141414]">
            JOIN TEAM WORKSPACE.
          </h2>
          <p className="text-xs text-[#444343] leading-relaxed">
            You have been invited to collaborate on WrapAI meetings, intelligence summaries, and reports.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-[#9e1c1c]/10 border border-[#9e1c1c] text-[#9e1c1c] text-xs font-mono flex items-center space-x-3 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="space-y-4">
            <div className="p-4 bg-[#1b6b36]/10 border border-[#1b6b36] text-[#1b6b36] text-xs font-mono flex items-center justify-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>JOINED "{resultData?.workspace?.name}" SUCCESSFULLY</span>
            </div>
            <Link to="/dashboard" className="block pt-2">
              <PosterButton variant="primary" size="lg" className="w-full">
                ENTER WORKSPACE
              </PosterButton>
            </Link>
          </div>
        ) : (
          <PosterButton
            variant="primary"
            size="lg"
            className="w-full"
            disabled={isLoading}
            onClick={handleAccept}
          >
            {isLoading ? 'JOINING WORKSPACE...' : 'ACCEPT INVITATION'}
          </PosterButton>
        )}
      </div>
    </div>
  );
}

export default AcceptInvitePage;
