interface FareSummaryProps {
  amount: number;
  currency?: string;
}

export function FareSummary({ amount, currency = 'Rs.' }: FareSummaryProps) {
  return (
    <div className="fare-info">
      <i className="fas fa-ticket-alt"></i>
      <div className="fare-text">
        Total fare:{' '}
        <span className="fare-amount">
          {currency} {amount}
        </span>
      </div>
    </div>
  );
}
