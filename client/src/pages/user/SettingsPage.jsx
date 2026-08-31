import React from 'react';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { ProgressBar } from '../../components/ui/ProgressBar.jsx';
import { User, Shield, Bell, HardDrive, Trash2 } from 'lucide-react';
import { formatBytes } from '../../utils/formatters.js';

export function SettingsPage() {
  const user = useSelector((state) => state.auth.user);
  const { register, handleSubmit } = useForm({
    defaultValues: {
      fullName: user?.fullName || 'Rahul Sharma',
      email: user?.email || 'rahul@wrapai.io',
      timezone: user?.timezone || 'UTC+05:30 (India Standard Time)'
    }
  });

  const onSubmit = () => {
    alert('Settings updated successfully in mock state.');
  };

  const usedBytes = user?.storageUsedBytes || 1284505600;
  const limitBytes = user?.storageLimitBytes || 5368709120;
  const storagePercent = Math.round((usedBytes / limitBytes) * 100);

  return (
    <div className="max-w-4xl space-y-10">
      <div className="pb-4 border-b border-brand-charcoal/15">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-brand-taupe">WORKSPACE CONFIGURATION</span>
        <h1 className="font-display text-4xl uppercase tracking-tight text-brand-navy mt-1">
          Account & Settings
        </h1>
      </div>

      {/* 1. Profile Section */}
      <Card className="p-8">
        <div className="flex items-center space-x-3 pb-4 border-b border-brand-charcoal/10 mb-6">
          <User className="w-5 h-5 text-brand-navy" />
          <h2 className="font-display text-2xl uppercase tracking-wide text-brand-navy">Profile Details</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name" {...register('fullName')} />
            <Input label="Email Address" type="email" disabled {...register('email')} />
          </div>

          <Select
            label="Timezone"
            {...register('timezone')}
            options={[
              { value: 'UTC+05:30 (India Standard Time)', label: 'UTC+05:30 (India Standard Time)' },
              { value: 'UTC-04:00 (Eastern Time)', label: 'UTC-04:00 (Eastern Time)' },
              { value: 'UTC+00:00 (GMT)', label: 'UTC+00:00 (GMT)' },
              { value: 'UTC+01:00 (Central European Time)', label: 'UTC+01:00 (Central European Time)' }
            ]}
          />

          <div className="pt-2 flex justify-end">
            <Button type="submit" variant="primary" size="sm">Save Profile</Button>
          </div>
        </form>
      </Card>

      {/* 2. Storage Quota Section */}
      <Card className="p-8">
        <div className="flex items-center space-x-3 pb-4 border-b border-brand-charcoal/10 mb-6">
          <HardDrive className="w-5 h-5 text-brand-navy" />
          <h2 className="font-display text-2xl uppercase tracking-wide text-brand-navy">Storage & Quota</h2>
        </div>

        <div className="space-y-4">
          <ProgressBar progress={storagePercent} label={`Storage Used: ${formatBytes(usedBytes)} of ${formatBytes(limitBytes)}`} />
          <p className="text-xs text-brand-taupe">
            Large audio and video files are preserved in high-durability AWS S3 object storage. Transcripts and vectors are stored in MongoDB Atlas.
          </p>
        </div>
      </Card>

      {/* 3. Security Section */}
      <Card className="p-8">
        <div className="flex items-center space-x-3 pb-4 border-b border-brand-charcoal/10 mb-6">
          <Shield className="w-5 h-5 text-brand-navy" />
          <h2 className="font-display text-2xl uppercase tracking-wide text-brand-navy">Security & Password</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Current Password" type="password" placeholder="••••••••" />
          <Input label="New Password" type="password" placeholder="••••••••" />
        </div>

        <div className="pt-4 flex justify-end">
          <Button variant="outline" size="sm">Change Password</Button>
        </div>
      </Card>

      {/* 4. Danger Zone */}
      <Card className="p-8 border-red-300 bg-red-50/30">
        <div className="flex items-center space-x-3 pb-4 border-b border-red-200 mb-4 text-red-900">
          <Trash2 className="w-5 h-5 text-red-700" />
          <h2 className="font-display text-2xl uppercase tracking-wide">Danger Zone</h2>
        </div>
        <p className="text-xs text-red-800 mb-4">
          Permanently delete your account and all associated audio, video, transcripts, and intelligence reports. This action is irreversible.
        </p>
        <Button variant="danger" size="sm">Delete Account</Button>
      </Card>
    </div>
  );
}
