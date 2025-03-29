import { Ticket, CreditCard, Coins } from 'lucide-react';

interface TicketInfoProps {
  ticketCost: number;
  isMobile?: boolean;
}

export default function TicketInfo({
  ticketCost,
  isMobile = false,
}: TicketInfoProps) {
  if (isMobile) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <h4 className="text-sm font-medium mb-3 flex items-center text-gray-800">
          <Ticket className="w-4 h-4 mr-2 text-primary" />
          Fare Information
        </h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-md">
            <div className="flex items-center">
              <CreditCard className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
              <span className="text-sm text-gray-500">Standard Ticket</span>
            </div>
            <span className="font-medium text-gray-800">Rs. {ticketCost}</span>
          </div>
          <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-md">
            <div className="flex items-center">
              <Coins className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
              <span className="text-sm text-gray-500">Day Pass</span>
            </div>
            <span className="font-medium text-gray-800">
              Rs. {ticketCost * 3}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 h-full">
      <h4 className="text-sm font-medium mb-3 flex items-center text-gray-800">
        <Ticket className="w-4 h-4 mr-2 text-primary" />
        Fare Information
      </h4>
      <div className="space-y-2">
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
          <div className="flex items-center">
            <CreditCard className="w-4 h-4 mr-1.5 text-gray-500" />
            <span className="text-sm text-gray-500">Standard Ticket</span>
          </div>
          <span className="font-medium text-gray-800">Rs. {ticketCost}</span>
        </div>
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
          <div className="flex items-center">
            <Coins className="w-4 h-4 mr-1.5 text-gray-500" />
            <span className="text-sm text-gray-500">Day Pass</span>
          </div>
          <span className="font-medium text-gray-800">
            Rs. {ticketCost * 3}
          </span>
        </div>
      </div>
    </div>
  );
}
