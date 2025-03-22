import { AlertCircle, RefreshCw, Wifi, Map, Clock, Globe } from 'lucide-react';

interface TroubleshootingItemProps {
  title: string;
  description: string;
  solution: string;
  icon: React.ReactNode;
}

function TroubleshootingItem({
  title,
  description,
  solution,
  icon,
}: TroubleshootingItemProps) {
  return (
    <div className="bg-white p-5 rounded-lg border border-gray-200 hover:border-[color:var(--color-accent)]/20 hover:shadow-sm transition-all duration-200">
      <div className="flex gap-4">
        <div className="w-10 h-10 rounded-full bg-[color:var(--color-accent)]/10 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="font-medium text-gray-800 mb-2">{title}</h3>
          <p className="text-sm text-[color:var(--color-gray-600)] mb-4">
            {description}
          </p>

          <div className="bg-gray-50 p-3 rounded-md border-l-2 border-[color:var(--color-accent)]">
            <h4 className="text-sm font-medium text-gray-700 mb-1">
              Solution:
            </h4>
            <p className="text-sm text-[color:var(--color-gray-600)]">
              {solution}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TroubleshootingSection() {
  const issues = [
    {
      title: 'App is loading slowly',
      description:
        'The application is taking longer than usual to load routes or respond to inputs.',
      solution:
        'Check your internet connection, close unnecessary background apps, and try refreshing the page. If the issue persists, clearing your browser cache may help improve performance.',
      icon: (
        <RefreshCw size={18} className="text-[color:var(--color-accent)]" />
      ),
    },
    {
      title: 'Location not being detected',
      description:
        'The app cannot access or detect your current location accurately.',
      solution:
        "Make sure location services are enabled on your device and that you've granted Safar permission to access your location. Restarting your device can also resolve location detection issues.",
      icon: <Map size={18} className="text-[color:var(--color-accent)]" />,
    },
    {
      title: 'Cannot connect to the server',
      description:
        "You're getting connection errors when trying to use the app's features.",
      solution:
        'Check your internet connection and ensure you have stable WiFi or mobile data. If using a VPN, try disabling it temporarily as it may interfere with the connection.',
      icon: <Wifi size={18} className="text-[color:var(--color-accent)]" />,
    },
    {
      title: 'Inaccurate route information',
      description:
        "The routes or schedules shown in the app don't match the actual transit options.",
      solution:
        "Our data is regularly updated, but transit changes may occur. Refresh the app and try your search again. You can also help by reporting inaccuracies through the 'Contribute' section.",
      icon: (
        <AlertCircle size={18} className="text-[color:var(--color-accent)]" />
      ),
    },
    {
      title: 'Missing real-time updates',
      description:
        "Real-time information about delays or schedule changes isn't appearing.",
      solution:
        'Real-time updates require a good internet connection and depend on data from transit authorities. Try refreshing the app or checking the official transit website for emergency notices.',
      icon: <Clock size={18} className="text-[color:var(--color-accent)]" />,
    },
    {
      title: 'Language or region issues',
      description:
        'The app is showing the wrong language or region-specific content.',
      solution:
        'Check your browser or device language settings. You can also try clearing your browser cache and cookies, which may reset regional preferences to default.',
      icon: <Globe size={18} className="text-[color:var(--color-accent)]" />,
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">
        Troubleshooting
      </h2>

      <p className="text-[color:var(--color-gray-600)] mb-6">
        Experiencing issues with Safar? Here are solutions to common problems:
      </p>

      <div className="space-y-4">
        {issues.map((issue, index) => (
          <TroubleshootingItem
            key={index}
            title={issue.title}
            description={issue.description}
            solution={issue.solution}
            icon={issue.icon}
          />
        ))}
      </div>
    </div>
  );
}
