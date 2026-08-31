import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { userService } from '../../services/userService.js';
import { updateUser } from '../../store/slices/authSlice.js';
import { PosterButton } from '../../components/ui/PosterButton.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { ProgressBar } from '../../components/ui/ProgressBar.jsx';
import { GridSidebarLabel } from '../../components/ui/GridSidebarLabel.jsx';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { formatBytes } from '../../utils/formatters.js';

export function SettingsPage() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [profileMsg, setProfileMsg] = useState(null);
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [passwordErr, setPasswordErr] = useState(null);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      fullName: user?.fullName || 'Rahul Sharma',
      email: user?.email || 'rahul@wrapai.io',
      timezone: user?.timezone || 'UTC+05:30 (India Standard Time)'
    }
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passErrors, isSubmitting: isPassSubmitting }
  } = useForm();

  const onProfileSubmit = async (data) => {
    setProfileMsg(null);
    try {
      const res = await userService.updateProfile({
        fullName: data.fullName,
        timezone: data.timezone
      });
      dispatch(updateUser(res.data));
      setProfileMsg('PROFILE DETAILS UPDATED SUCCESSFULLY.');
    } catch (err) {
      alert(err.message || 'Failed to update profile');
    }
  };

  const onPasswordSubmit = async (data) => {
    setPasswordMsg(null);
    setPasswordErr(null);
    try {
      await userService.changePassword(data.currentPassword, data.newPassword);
      setPasswordMsg('PASSWORD CHANGED SUCCESSFULLY.');
      resetPasswordForm();
    } catch (err) {
      setPasswordErr(err.message || 'Failed to update password');
    }
  };

  const usedBytes = user?.storageUsedBytes || 1284505600;
  const limitBytes = user?.storageLimitBytes || 5368709120;
  const storagePercent = Math.round((usedBytes / limitBytes) * 100);

  return (
    <div className="space-y-12">
      {/* 1. Header */}
      <div className="border-b border-[#C7C7C7] pb-8">
        <div className="space-y-2">
          <span className="font-mono text-xs font-bold text-[#1351AA] uppercase tracking-[0.2em] block">
            USER CONFIGURATION
          </span>
          <h1 className="text-poster-section text-[#141414]">
            ACCOUNT <br />
            <span className="text-[#1351AA]">SETTINGS.</span>
          </h1>
          <p className="text-xs font-mono text-[#7A7A7A] uppercase">
            PROFILE, SECURITY PREFERENCES & STORAGE QUOTAS
          </p>
        </div>
      </div>

      {/* 2. Profile Details */}
      <div className="grid grid-cols-12 gap-8">
        <GridSidebarLabel label="PROFILE" index="01">
          <p className="text-xs font-mono text-[#7A7A7A] uppercase leading-relaxed">
            IDENTIFICATION
          </p>
        </GridSidebarLabel>

        <div className="col-span-12 lg:col-span-9 bg-white/70 border border-[#C7C7C7] p-6 sm:p-10 space-y-6">
          {profileMsg && (
            <div className="p-4 bg-[#1b6b36]/10 border border-[#1b6b36] text-[#1b6b36] text-xs font-mono flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{profileMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input label="FULL NAME" {...register('fullName', { required: true })} />
              <Input label="EMAIL ADDRESS" type="email" disabled {...register('email')} />
            </div>

            <Select
              label="TIMEZONE"
              {...register('timezone')}
              options={[
                { value: 'UTC+05:30 (India Standard Time)', label: 'UTC+05:30 (INDIA STANDARD TIME)' },
                { value: 'UTC-04:00 (Eastern Time)', label: 'UTC-04:00 (EASTERN TIME)' },
                { value: 'UTC+00:00 (GMT)', label: 'UTC+00:00 (GMT)' },
                { value: 'UTC+01:00 (Central European Time)', label: 'UTC+01:00 (CENTRAL EUROPEAN TIME)' }
              ]}
            />

            <div className="pt-2 flex justify-end">
              <PosterButton type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                {isSubmitting ? 'SAVING...' : 'SAVE PROFILE'}
              </PosterButton>
            </div>
          </form>
        </div>
      </div>

      {/* 3. Storage Quota */}
      <div className="grid grid-cols-12 gap-8">
        <GridSidebarLabel label="STORAGE" index="02">
          <p className="text-xs font-mono text-[#7A7A7A] uppercase leading-relaxed">
            S3 OBJECT USAGE
          </p>
        </GridSidebarLabel>

        <div className="col-span-12 lg:col-span-9 bg-white/70 border border-[#C7C7C7] p-6 sm:p-10 space-y-4">
          <ProgressBar progress={storagePercent} label={`STORAGE USED: ${formatBytes(usedBytes)} OF ${formatBytes(limitBytes)}`} />
          <p className="text-xs font-mono text-[#7A7A7A] leading-relaxed">
            AUDIO AND VIDEO STREAM ASSETS ARE STORED IN HIGH-DURABILITY AWS S3 OBJECT STORAGE. VECTOR EMBEDDINGS AND TRANSCRIPTS ARE MANAGED IN MONGODB ATLAS.
          </p>
        </div>
      </div>

      {/* 4. Security */}
      <div className="grid grid-cols-12 gap-8">
        <GridSidebarLabel label="SECURITY" index="03">
          <p className="text-xs font-mono text-[#7A7A7A] uppercase leading-relaxed">
            ACCESS KEYS
          </p>
        </GridSidebarLabel>

        <div className="col-span-12 lg:col-span-9 bg-white/70 border border-[#C7C7C7] p-6 sm:p-10 space-y-6">
          {passwordMsg && (
            <div className="p-4 bg-[#1b6b36]/10 border border-[#1b6b36] text-[#1b6b36] text-xs font-mono flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{passwordMsg}</span>
            </div>
          )}

          {passwordErr && (
            <div className="p-4 bg-[#9e1c1c]/10 border border-[#9e1c1c] text-[#9e1c1c] text-xs font-mono flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordErr}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input
                label="CURRENT PASSWORD"
                type="password"
                placeholder="••••••••"
                error={passErrors.currentPassword?.message}
                {...registerPassword('currentPassword', { required: 'Current password is required' })}
              />
              <Input
                label="NEW PASSWORD"
                type="password"
                placeholder="••••••••"
                error={passErrors.newPassword?.message}
                {...registerPassword('newPassword', { required: 'New password is required', minLength: { value: 6, message: 'Minimum 6 characters' } })}
              />
            </div>

            <div className="pt-2 flex justify-end">
              <PosterButton type="submit" variant="outline" size="sm" disabled={isPassSubmitting}>
                {isPassSubmitting ? 'UPDATING...' : 'CHANGE PASSWORD'}
              </PosterButton>
            </div>
          </form>
        </div>
      </div>

      {/* 5. Danger Zone */}
      <div className="grid grid-cols-12 gap-8">
        <GridSidebarLabel label="DANGER ZONE" index="04">
          <p className="text-xs font-mono text-[#9e1c1c] uppercase leading-relaxed font-bold">
            IRREVERSIBLE
          </p>
        </GridSidebarLabel>

        <div className="col-span-12 lg:col-span-9 bg-[#9e1c1c]/5 border border-[#9e1c1c] p-6 sm:p-10 space-y-4">
          <h3 className="text-lg font-black uppercase text-[#9e1c1c]">
            DELETE ACCOUNT
          </h3>
          <p className="text-xs font-mono text-[#444343] leading-relaxed">
            PERMANENTLY DELETE YOUR ACCOUNT AND ALL ASSOCIATED RECORDINGS, TRANSCRIPTS, CHATS, EMBEDDINGS, AND INTELLIGENCE REPORTS.
          </p>
          <div className="pt-2">
            <PosterButton
              variant="danger"
              size="sm"
              onClick={async () => {
                if (window.confirm('Are you absolutely sure you want to delete your WrapAI account? This action cannot be undone.')) {
                  try {
                    await userService.deleteAccount();
                    window.location.assign('/login');
                  } catch (err) {
                    alert(err.message || 'Failed to delete account');
                  }
                }
              }}
            >
              DELETE ACCOUNT
            </PosterButton>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
