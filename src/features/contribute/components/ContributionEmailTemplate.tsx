import * as React from 'react';
import { ContributionData } from '../types';

interface EmailTemplateProps {
  data: ContributionData;
}

// Email template optimized for Resend
export const ContributionEmailTemplate = ({ data }: EmailTemplateProps) => {
  return (
    <div
      style={{
        fontFamily: 'Arial, sans-serif',
        maxWidth: '600px',
        margin: '0 auto',
        color: '#333333',
      }}
    >
      <table
        style={{ width: '100%', borderCollapse: 'collapse' }}
        cellPadding="0"
        cellSpacing="0"
      >
        <tbody>
          <tr>
            <td style={{ padding: '30px 0 20px 0', textAlign: 'center' }}>
              <h1
                style={{
                  color: '#10b981',
                  fontSize: '24px',
                  margin: '0 0 15px 0',
                  fontWeight: 'bold',
                }}
              >
                New Contribution Received
              </h1>
            </td>
          </tr>

          <tr>
            <td
              style={{
                backgroundColor: '#f9fafb',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px',
              }}
            >
              <h2
                style={{
                  fontSize: '18px',
                  margin: '0 0 15px 0',
                  color: '#374151',
                  fontWeight: 'bold',
                }}
              >
                Contributor Details
              </h2>
              <p
                style={{ margin: '5px 0', color: '#4b5563', fontSize: '14px' }}
              >
                <strong>Name:</strong> {data.name}
              </p>
              <p
                style={{ margin: '5px 0', color: '#4b5563', fontSize: '14px' }}
              >
                <strong>Email:</strong> {data.email}
              </p>
              <p
                style={{ margin: '5px 0', color: '#4b5563', fontSize: '14px' }}
              >
                <strong>Contribution Type:</strong> {data.contributionType}
              </p>
            </td>
          </tr>

          <tr>
            <td style={{ height: '20px' }}></td>
          </tr>

          <tr>
            <td
              style={{
                backgroundColor: '#f0fdf4',
                padding: '20px',
                borderRadius: '8px',
              }}
            >
              <h2
                style={{
                  fontSize: '18px',
                  margin: '0 0 15px 0',
                  color: '#374151',
                  fontWeight: 'bold',
                }}
              >
                Contribution Details
              </h2>

              {data.routeDetails && (
                <div style={{ marginBottom: '15px' }}>
                  <h3
                    style={{
                      fontSize: '16px',
                      margin: '0 0 5px 0',
                      color: '#4b5563',
                      fontWeight: 'bold',
                    }}
                  >
                    Route Information
                  </h3>
                  <p
                    style={{
                      margin: '0',
                      color: '#4b5563',
                      fontSize: '14px',
                      lineHeight: '1.5',
                    }}
                  >
                    {data.routeDetails}
                  </p>
                </div>
              )}

              {data.stationDetails && (
                <div style={{ marginBottom: '15px' }}>
                  <h3
                    style={{
                      fontSize: '16px',
                      margin: '0 0 5px 0',
                      color: '#4b5563',
                      fontWeight: 'bold',
                    }}
                  >
                    Station Information
                  </h3>
                  <p
                    style={{
                      margin: '0',
                      color: '#4b5563',
                      fontSize: '14px',
                      lineHeight: '1.5',
                    }}
                  >
                    {data.stationDetails}
                  </p>
                </div>
              )}

              <div>
                <h3
                  style={{
                    fontSize: '16px',
                    margin: '0 0 5px 0',
                    color: '#4b5563',
                    fontWeight: 'bold',
                  }}
                >
                  Description
                </h3>
                <p
                  style={{
                    margin: '0',
                    color: '#4b5563',
                    fontSize: '14px',
                    lineHeight: '1.5',
                  }}
                >
                  {data.description}
                </p>
              </div>
            </td>
          </tr>

          <tr>
            <td style={{ height: '30px' }}></td>
          </tr>

          <tr>
            <td
              style={{
                borderTop: '1px solid #e5e7eb',
                padding: '15px 0',
                textAlign: 'center',
              }}
            >
              <p
                style={{ margin: '5px 0', fontSize: '12px', color: '#6b7280' }}
              >
                This contribution was submitted from the Safar website.
              </p>
              <p
                style={{ margin: '5px 0', fontSize: '12px', color: '#6b7280' }}
              >
                © {new Date().getFullYear()} Safar. All rights reserved.
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
