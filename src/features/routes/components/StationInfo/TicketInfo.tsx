import { Ticket, CreditCard, Coins, Tag } from 'lucide-react';

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
          <Tag className="w-4 h-4 mr-2 text-emerald-500" />
          Fare Information
        </h4>
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-md">
            <CreditCard className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
            <div className="flex-1 flex justify-between items-center">
              <span className="text-sm text-gray-600">Standard Ticket:</span>
              <span className="font-medium text-sm text-gray-800">
                Rs. {ticketCost}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-md">
            <Coins className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
            <div className="flex-1 flex justify-between items-center">
              <span className="text-sm text-gray-600">Day Pass:</span>
              <span className="font-medium text-sm text-gray-800">
                Rs. {ticketCost * 3}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 h-full">
      <h4 className="text-sm font-medium mb-3 flex items-center text-gray-800">
        <Tag className="w-4 h-4 mr-2 text-emerald-500" />
        Fare Information
      </h4>

      <div className="space-y-3">
        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
          <div className="flex-shrink-0 bg-white p-1.5 rounded-md shadow-sm">
            <CreditCard className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex-1 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              Standard Ticket
            </span>
            <span className="font-medium text-sm text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              Rs. {ticketCost}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
          <div className="flex-shrink-0 bg-white p-1.5 rounded-md shadow-sm">
            <Coins className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex-1 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Day Pass</span>
            <span className="font-medium text-sm text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              Rs. {ticketCost * 3}
            </span>
          </div>
        </div>

        <div className="flex items-center mt-2 pt-2 border-t border-gray-100">
          <Ticket className="w-3.5 h-3.5 text-gray-500 mr-1.5" />
          <span className="text-xs text-gray-500">
            Tickets can be purchased at any station counter or through the Safar
            mobile app
          </span>
        </div>
      </div>
    </div>
  );
}
