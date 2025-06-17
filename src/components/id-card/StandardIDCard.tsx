
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

// Logo paths - using SVGs from public folder
const GOVERNMENT_LOGO = '/emblem.svg';
const SEAL_LOGO = '/logo.svg';

type UserData = {
  name: string;
  nic: string;
  mobile?: string;
  address: string;
  public_id: string;
  date_of_birth?: string;
  photo_url?: string;
  signature_url?: string;
  qr_code_data?: string;
};

interface StandardIDCardProps {
  userData: UserData;
  showBack?: boolean;
}

const StandardIDCard: React.FC<StandardIDCardProps> = ({ 
  userData, 
  showBack = false 
}) => {
  // Format date of birth if available
  const formatDateOfBirth = (dob: string | undefined): string => {
    if (!dob) return 'N/A';
    try {
      return new Date(dob).toLocaleDateString('en-GB');
    } catch (e) {
      return dob;
    }
  };

  // Format address to fit in the card
  const formatAddress = (address: string): string => {
    if (!address) return 'N/A';
    // Truncate long addresses
    if (address.length > 40) {
      return `${address.substring(0, 37)}...`;
    }
    return address;
  };

  // Generate QR code data
  const qrData = userData.qr_code_data || JSON.stringify({
    name: userData.name,
    nic: userData.nic,
    public_id: userData.public_id,
    timestamp: new Date().toISOString()
  });

  // Back of the card
  if (showBack) {
    return (
      <div className="w-[85.6mm] h-[54mm] bg-white border border-gray-300 p-5 flex flex-col items-center justify-center text-center font-sans">
        <h3 className="text-lg font-bold mb-3">Divisional Secretariat - Kalmunai</h3>
        <p className="text-[8pt] mb-2">This is an official identification card</p>
        <p className="text-[7pt] mt-2">If found, please return to:</p>
        <p className="text-[7pt]">Divisional Secretariat, Kalmunai</p>
        <p className="text-[7pt]">Phone: 067-222 2222</p>
      </div>
    );
  }

  // Front of the card
  return (
    <div className="w-[85.6mm] h-[54mm] bg-white border border-gray-300 shadow-sm flex flex-col font-sans">
      {/* Header with logos and title */}
      <div className="bg-white p-1 flex items-center justify-between border-b border-gray-300">
        <div className="w-8 h-8 flex items-center justify-center">
          <img 
            src={GOVERNMENT_LOGO}
            alt="Government Logo" 
            className="h-7 w-auto object-contain"
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = '';
              if (target.parentElement) {
                target.parentElement.innerHTML = '<div class="text-[6px] text-center">GOVT<br/>LOGO</div>';
              }
            }}
          />
        </div>
        <div className="text-center">
          <div className="text-[8pt] font-bold uppercase">Divisional Secretariat</div>
          <div className="text-[7pt] font-semibold">Kalmunai</div>
        </div>
        <div className="w-8 h-8 flex items-center justify-center">
          <img 
            src={SEAL_LOGO}
            alt="Seal" 
            className="h-7 w-auto object-contain"
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = '';
              if (target.parentElement) {
                target.parentElement.innerHTML = '<div class="text-[6px] text-center">SEAL</div>';
              }
            }}
          />
        </div>
      </div>

      {/* Card content */}
      <div className="flex-1 p-1.5 flex">
        {/* Left side - User info */}
        <div className="w-1/2 pr-1.5 flex flex-col justify-between">
          <div className="space-y-0.5">
            <div className="mb-0.5">
              <div className="text-[6pt] font-bold">Name:</div>
              <div className="text-[7pt] border-b border-gray-300 min-h-[12px]">{userData.name || 'N/A'}</div>
            </div>
            <div className="mb-0.5">
              <div className="text-[6pt] font-bold">NIC:</div>
              <div className="text-[7pt] border-b border-gray-300 min-h-[12px]">{userData.nic || 'N/A'}</div>
            </div>
            <div className="mb-0.5">
              <div className="text-[6pt] font-bold">Date of Birth:</div>
              <div className="text-[7pt] border-b border-gray-300 min-h-[12px]">
                {formatDateOfBirth(userData.date_of_birth)}
              </div>
            </div>
            <div className="mb-0.5">
              <div className="text-[6pt] font-bold">Mobile:</div>
              <div className="text-[7pt] border-b border-gray-300 min-h-[12px]">
                {userData.mobile || 'N/A'}
              </div>
            </div>
            <div className="mb-0.5">
              <div className="text-[6pt] font-bold">Address:</div>
              <div className="text-[7pt] border-b border-gray-300 min-h-[12px]">
                {formatAddress(userData.address)}
              </div>
            </div>
            <div className="mb-0.5">
              <div className="text-[6pt] font-bold">Public ID:</div>
              <div className="text-[7pt] border-b border-gray-300 min-h-[12px] font-mono">
                {userData.public_id || 'N/A'}
              </div>
            </div>
          </div>
          
          {/* Signature and date */}
          <div className="mt-1 text-center">
            <div className="h-4 border-t border-gray-400 relative mt-1">
              <span className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-white px-2 text-[5pt] text-gray-600">
                Authorized Signature
              </span>
            </div>
            {userData.signature_url && (
              <img 
                src={userData.signature_url} 
                alt="Signature" 
                className="h-[8mm] mx-auto object-contain"
              />
            )}
            <div className="text-[5pt] text-gray-600 mt-0.5">
              Date: {new Date().toLocaleDateString('en-GB')}
            </div>
          </div>
        </div>

        {/* Right side - QR Code */}
        <div className="w-1/2 pl-1.5 flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full max-w-[35mm] aspect-square border border-gray-300 p-1 mb-1">
              <QRCodeSVG 
                value={qrData}
                size={128}
                level="H"
                includeMargin={false}
                className="w-full h-auto"
              />
            </div>
            <div className="text-[5pt] text-gray-600 text-center">
              Scan to verify authenticity
            </div>
          </div>
          
          {/* Photo placeholder */}
          <div className="flex justify-center mt-auto pt-2">
            {userData.photo_url ? (
              <div className="w-[16mm] h-[20mm] border border-gray-300 overflow-hidden">
                <img 
                  src={userData.photo_url} 
                  alt="User" 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-[16mm] h-[20mm] border border-gray-300 flex items-center justify-center text-[6pt] text-gray-500">
                PHOTO
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-gray-100 py-1 text-center text-[5pt] text-gray-600 border-t border-gray-300">
        Divisional Secretariat, Kalmunai | Phone: 067-222 2222 | Email: info@kalmunai.ds.gov.lk
      </div>
    </div>
  );
};

export default StandardIDCard;
