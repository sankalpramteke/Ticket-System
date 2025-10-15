'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function NotificationPreferencesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [preferences, setPreferences] = useState({
    emailEnabled: true,
    ticketCreated: true,
    ticketAssigned: true,
    ticketStatusChanged: true,
    ticketPriorityChanged: true,
    newComment: true,
    profileUpdated: true
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch('/api/users/preferences', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 401) {
        router.push('/login');
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(preferences)
      });

      if (res.ok) {
        setMessage('✅ Preferences saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('❌ Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage('❌ Error saving preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-600">Loading preferences...</div>
        </div>
      </>
    );
  }

  const notificationOptions = [
    {
      key: 'emailEnabled',
      title: 'Email Notifications',
      description: 'Master switch for all email notifications',
      icon: '📧',
      important: true
    },
    {
      key: 'ticketCreated',
      title: 'Ticket Created',
      description: 'Notify when you create a new ticket',
      icon: '🎫'
    },
    {
      key: 'ticketAssigned',
      title: 'Ticket Assigned',
      description: 'Notify when a ticket is assigned to you',
      icon: '👨‍💼'
    },
    {
      key: 'ticketStatusChanged',
      title: 'Status Changes',
      description: 'Notify when ticket status changes (Open, In Progress, Resolved, Closed)',
      icon: '🔄'
    },
    {
      key: 'ticketPriorityChanged',
      title: 'Priority Changes',
      description: 'Notify when ticket priority changes (Low, Medium, High)',
      icon: '⚡'
    },
    {
      key: 'newComment',
      title: 'New Comments',
      description: 'Notify when someone comments on your tickets',
      icon: '💬'
    },
    {
      key: 'profileUpdated',
      title: 'Profile Updates',
      description: 'Notify when your profile is updated by an admin',
      icon: '👤'
    }
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Notification Preferences</h1>
            <p className="text-gray-600 mt-2">
              Manage how you receive email notifications about your tickets and updates.
            </p>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {message}
            </div>
          )}

          <Card className="p-6">
            <div className="space-y-6">
              {notificationOptions.map((option) => (
                <div
                  key={option.key}
                  className={`flex items-start justify-between py-4 border-b last:border-b-0 ${option.important ? 'bg-blue-50 -mx-6 px-6 rounded-lg' : ''}`}
                >
                  <div className="flex items-start space-x-3 flex-1">
                    <span className="text-2xl mt-1">{option.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {option.title}
                        {option.important && (
                          <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded">
                            Master Switch
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle(option.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      preferences[option.key] ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                    disabled={option.key !== 'emailEnabled' && !preferences.emailEnabled}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences[option.key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {!preferences.emailEnabled && '⚠️ All notifications are currently disabled'}
              </p>
              <div className="flex space-x-3">
                <Button
                  onClick={() => router.back()}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </div>
          </Card>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">💡 How it works</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Emails are sent to your registered email address</li>
              <li>You can disable specific notification types at any time</li>
              <li>The master switch (Email Notifications) controls all notifications</li>
              <li>Changes take effect immediately</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
