import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { workspaceService } from '../../services/workspaceService.js';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { LoadingState } from '../../components/common/LoadingState.jsx';
import { Users, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

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
      // Store token in session and redirect to login
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
    <div className="max-w-md mx-auto py-16 px-4">
      <Card className="p-8 bg-brand-white border border-brand-charcoal/20 shadow-2xl text-center space-y-6">
        <div className="w-12 h-12 bg-brand-navy text-brand-white flex items-center justify-center mx-auto">
          <Users className="w-6 h-6 text-brand-cyan" />
        </div>

        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-brand-taupe uppercase">
            WORKSPACE INVITATION
          </span>
          <h2 className="font-display text-2xl uppercase tracking-wide text-brand-navy mt-1">
            Join Team Workspace
          </h2>
          <p className="text-xs text-brand-charcoal mt-1">
            You have been invited to collaborate on WrapAI meetings, intelligence summaries, and reports.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2 text-left">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Joined "{resultData?.workspace?.name}" successfully!</span>
            </div>
            <Link to="/dashboard">
              <Button variant="primary" size="md" className="w-full" icon={ArrowRight}>
                Enter Workspace
              </Button>
            </Link>
          </div>
        ) : (
          <Button
            variant="primary"
            size="md"
            className="w-full"
            disabled={isLoading}
            onClick={handleAccept}
          >
            {isLoading ? 'Joining Workspace...' : 'Accept Invitation'}
          </Button>
        )}
      </Card>
    </div>
  );
}
