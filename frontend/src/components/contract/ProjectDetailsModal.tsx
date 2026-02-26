import React from 'react';
import { X, User, Calendar, DollarSign, FileText } from 'lucide-react';

// Contract interface - matches the one in contract/page.tsx
interface Contract {
  id: string;
  clientId: string;
  developerId?: string;
  title: string;
  description: string;
  currency: string;
  totalAmount: number;
  status: string;
  fundingMode: string;
  startAt?: string;
  createdAt: string;
  updatedAt: string;
  termsVersion: string;
  metadata: Record<string, any>;
  milestones?: Array<{
    id: string;
    title: string;
    description: string;
    amount: number;
    status: string;
  }>;
}

interface ProjectDetailsModalProps {
  contract: Contract;
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({ contract, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Project Details</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title and Status */}
          <div>
            <h1 className="text-2xl font-bold text-white mb-3">{contract.title}</h1>
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                contract.status === 'ACTIVE_FUNDED' 
                  ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                  : 'bg-white/5 text-gray-400 border border-white/10'
              }`}>
                {contract.status.replace(/_/g, ' ')}
              </span>
              <span className="text-sm text-gray-400">
                {contract.fundingMode === 'FULL_UPFRONT' ? 'Full Upfront Payment' : 'Milestone-based Payment'}
              </span>
            </div>
            <p className="text-gray-300 leading-relaxed">{contract.description}</p>
          </div>

          {/* Key Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-[#E70008]" />
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Amount</h3>
              </div>
              <p className="text-xl font-bold text-white">{contract.currency} {contract.totalAmount.toLocaleString()}</p>
            </div>

            <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-[#E70008]" />
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Timeline</h3>
              </div>
              <p className="text-sm text-gray-300">
                {contract.startAt ? new Date(contract.startAt).toLocaleDateString() : 'Not set'}
              </p>
            </div>
          </div>

          {/* Parties Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Project Parties</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Client Information */}
              <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                    {contract.metadata.clientName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{contract.metadata.clientName}</h4>
                    <p className="text-sm text-gray-400">Client</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-gray-500" />
                    <span className="text-gray-300">{contract.clientId}</span>
                  </div>
                </div>
              </div>

              {/* Developer Information */}
              <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#E70008] flex items-center justify-center text-white font-bold">
                    {contract.metadata.developerName?.charAt(0) || '?'}
                  </div>
                  <div>
                    <h4 className="text-white font-medium">{contract.metadata.developerName}</h4>
                    <p className="text-sm text-gray-400">Developer</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-gray-500" />
                    <span className="text-gray-300">{contract.developerId}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contract Metadata */}
          <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Contract Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Contract ID:</span>
                <p className="text-gray-300 font-mono">{contract.id}</p>
              </div>
              <div>
                <span className="text-gray-500">Created:</span>
                <p className="text-gray-300">{new Date(contract.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="text-gray-500">Payment Mode:</span>
                <p className="text-gray-300">{contract.fundingMode.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <span className="text-gray-500">Milestones:</span>
                <p className="text-gray-300">{contract.milestones?.length || 0} total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          >
            Close
          </button>
          <button className="px-4 py-2 rounded-lg bg-[#E70008] hover:bg-[#ff1f29] text-white transition-colors flex items-center gap-2">
            <FileText size={16} />
            View Full Contract
          </button>
        </div>
      </div>
    </div>
  );
};