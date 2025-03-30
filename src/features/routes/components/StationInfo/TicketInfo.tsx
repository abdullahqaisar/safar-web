import React from 'react';
import { Ticket } from 'lucide-react';

interface TicketInfoProps {
  ticketCost?: string | number;
  compact?: boolean;
}

export default function TicketInfo({
  ticketCost = 30,
  compact = false,
}: TicketInfoProps) {
  return (
    <div className={compact ? 'bg-gray-50 rounded-lg p-2.5' : 'space-y-2'}>
      <div
        className={
          compact
            ? 'text-xs text-gray-500 mb-1'
            : 'text-sm font-medium text-gray-700 flex items-center'
        }
      >
        {!compact && (
          <Ticket className="w-4 h-4 text-[color:var(--color-accent)] mr-1.5" />
        )}
        {compact ? 'Fare' : 'Fare Information'}
      </div>

      {compact ? (
        <div className="font-medium">Rs. {ticketCost}</div>
      ) : (
        <div className="grid grid-cols-2 gap-y-2 text-sm bg-gray-50 rounded-lg p-3">
          <div className="text-gray-500">Standard Fare</div>
          <div className="text-gray-900 font-medium">Rs. {ticketCost}</div>
          <div className="text-gray-500">Day Pass</div>
          <div className="text-gray-900 font-medium">
            Rs. {Number(ticketCost) * 3}
          </div>
          <div className="text-gray-500">Weekly Pass</div>
          <div className="text-gray-900 font-medium">
            Rs. {Number(ticketCost) * 10}
          </div>
        </div>
      )}
    </div>
  );
}
