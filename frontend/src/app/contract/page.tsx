'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Lock, 
  FileText, 
  ShieldCheck, 
  AlertCircle,
  Plus,
  Bot,
  Download,
  X,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Upload,
  Link as LinkIcon,
  MessageSquare,
  History,
  AlertTriangle,
  MoreVertical,
  User,
  Wallet,
  Send,
  Check,
  XCircle,
  Pause,
  Play,
  RefreshCw,
  FileUp,
  Github,
  Video,
  Image as ImageIcon,
  Edit3,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  FolderOpen,
  Users,
  Settings
} from 'lucide-react';
import { ProjectDetailsModal, DocumentsModal, GroupsModal, MagnaAIModal } from '@/components/contract';

// Types based on backend spec
type ContractStatus = 
  | 'DRAFT' 
  | 'PENDING_DEVELOPER_ACCEPTANCE' 
  | 'ACTIVE_UNFUNDED' 
  | 'ACTIVE_FUNDED' 
  | 'PAUSED' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'TERMINATED';

type MilestoneStatus = 
  | 'NOT_STARTED' 
  | 'IN_PROGRESS' 
  | 'SUBMITTED' 
  | 'IN_REVIEW' 
  | 'CHANGES_REQUESTED' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'RELEASED';

type FundingMode = 'NEXT_MILESTONE_REQUIRED' | 'FULL_UPFRONT';
type EvidenceType = 'LINK' | 'FILE' | 'TEXT' | 'SCREENSHOT' | 'REPO_COMMIT' | 'DEMO_URL';

interface EvidenceItem {
  id: string;
  type: EvidenceType;
  url?: string;
  fileId?: string;
  text?: string;
  label: string;
  createdAt: string;
}

interface ProgressSubmission {
  id: string;
  milestoneId: string;
  submittedBy: 'DEVELOPER' | 'CLIENT';
  summary: string;
  evidenceItems: EvidenceItem[];
  createdAt: string;
  updatedAt: string;
}

interface MilestoneReview {
  id: string;
  milestoneId: string;
  reviewerId: string;
  decision: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES';
  reasonCode?: string;
  comments: string;
  createdAt: string;
}

interface Milestone {
  id: string;
  contractId: string;
  title: string;
  description: string;
  acceptanceCriteria: string;
  amount: number;
  dueAt: string;
  orderIndex: number;
  status: MilestoneStatus;
  createdAt: string;
  updatedAt: string;
  submissions?: ProgressSubmission[];
  reviews?: MilestoneReview[];
  currentSubmission?: ProgressSubmission;
}

interface EscrowAccount {
  contractId: string;
  fundedTotal: number;
  releasedTotal: number;
  refundedTotal: number;
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED';
}

interface EscrowTransaction {
  id: string;
  contractId: string;
  type: 'FUND' | 'RELEASE' | 'REFUND' | 'ADJUSTMENT';
  amount: number;
  from: string;
  to: string;
  providerReference?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  createdAt: string;
}

interface ChangeRequest {
  id: string;
  contractId: string;
  proposedBy: string;
  type: 'SCOPE' | 'COST' | 'TIME' | 'SPLIT' | 'MERGE';
  changes: Record<string, any>;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

interface ActivityLog {
  id: string;
  contractId: string;
  actorId: string;
  actionType: string;
  payload: Record<string, any>;
  createdAt: string;
}

interface Contract {
  id: string;
  clientId: string;
  developerId?: string;
  title: string;
  description: string;
  currency: string;
  totalAmount: number;
  status: ContractStatus;
  fundingMode: FundingMode;
  startAt?: string;
  createdAt: string;
  updatedAt: string;
  termsVersion: string;
  metadata: Record<string, any>;
  milestones: Milestone[];
  escrow?: EscrowAccount;
  transactions?: EscrowTransaction[];
  changeRequests?: ChangeRequest[];
  activityLogs?: ActivityLog[];
}

// Mock data
const mockContract: Contract = {
  id: 'cont-123',
  clientId: 'client-1',
  developerId: 'dev-1',
  title: 'Shift Booking Platform',
  description: 'Mobile-first shift booking system with real-time availability',
  currency: 'KES',
  totalAmount: 180000,
  status: 'ACTIVE_FUNDED',
  fundingMode: 'NEXT_MILESTONE_REQUIRED',
  startAt: '2026-02-16',
  createdAt: '2026-02-15',
  updatedAt: '2026-02-20',
  termsVersion: '1.0',
  metadata: {
    clientName: 'Greenway Logistics',
    developerName: 'Magna Coders Team',
    estimatedDays: 21
  },
  milestones: [
    {
      id: 'ms-1',
      contractId: 'cont-123',
      title: 'UI/UX Design',
      description: 'Complete Figma designs for all screens',
      acceptanceCriteria: 'All screens designed, prototype functional, client approval',
      amount: 40000,
      dueAt: '2026-02-20',
      orderIndex: 1,
      status: 'RELEASED',
      createdAt: '2026-02-15',
      updatedAt: '2026-02-21',
      submissions: [{
        id: 'sub-1',
        milestoneId: 'ms-1',
        submittedBy: 'DEVELOPER',
        summary: 'Designs completed and uploaded to Figma',
        evidenceItems: [
          { id: 'ev-1', type: 'LINK', url: 'https://figma.com/design/abc', label: 'Figma Designs', createdAt: '2026-02-19' },
          { id: 'ev-2', type: 'SCREENSHOT', fileId: 'img-1', label: 'Mobile Preview', createdAt: '2026-02-19' }
        ],
        createdAt: '2026-02-19',
        updatedAt: '2026-02-19'
      }],
      reviews: [{
        id: 'rev-1',
        milestoneId: 'ms-1',
        reviewerId: 'client-1',
        decision: 'APPROVE',
        comments: 'Excellent work, exactly what we needed',
        createdAt: '2026-02-20'
      }]
    },
    {
      id: 'ms-2',
      contractId: 'cont-123',
      title: 'MVP Development',
      description: 'Core booking functionality with auth and payments',
      acceptanceCriteria: 'Users can book shifts, pay via M-Pesa, admin dashboard working',
      amount: 120000,
      dueAt: '2026-03-10',
      orderIndex: 2,
      status: 'IN_PROGRESS',
      createdAt: '2026-02-15',
      updatedAt: '2026-02-22'
    },
    {
      id: 'ms-3',
      contractId: 'cont-123',
      title: 'Deployment + Handover',
      description: 'Production deployment and documentation',
      acceptanceCriteria: 'Live on production URL, documentation complete, training done',
      amount: 20000,
      dueAt: '2026-03-18',
      orderIndex: 3,
      status: 'NOT_STARTED',
      createdAt: '2026-02-15',
      updatedAt: '2026-02-15'
    }
  ],
  escrow: {
    contractId: 'cont-123',
    fundedTotal: 180000,
    releasedTotal: 40000,
    refundedTotal: 0,
    status: 'ACTIVE'
  },
  transactions: [
    {
      id: 'tx-1',
      contractId: 'cont-123',
      type: 'FUND',
      amount: 180000,
      from: 'client-1',
      to: 'escrow',
      providerReference: 'mpesa-123',
      status: 'SUCCESS',
      createdAt: '2026-02-16'
    },
    {
      id: 'tx-2',
      contractId: 'cont-123',
      type: 'RELEASE',
      amount: 40000,
      from: 'escrow',
      to: 'dev-1',
      status: 'SUCCESS',
      createdAt: '2026-02-21'
    }
  ],
  activityLogs: [
    {
      id: 'act-1',
      contractId: 'cont-123',
      actorId: 'client-1',
      actionType: 'CONTRACT_CREATED',
      payload: {},
      createdAt: '2026-02-15'
    },
    {
      id: 'act-2',
      contractId: 'cont-123',
      actorId: 'dev-1',
      actionType: 'CONTRACT_ACCEPTED',
      payload: {},
      createdAt: '2026-02-16'
    },
    {
      id: 'act-3',
      contractId: 'cont-123',
      actorId: 'client-1',
      actionType: 'ESCROW_FUNDED',
      payload: { amount: 180000 },
      createdAt: '2026-02-16'
    }
  ]
};

const LeftControlPanel = ({ 
  contract, 
  className = "", 
  onClose, 
  isExpanded = true,
  setIsExpanded,
  onOpenModal
}: { 
  contract: Contract, 
  className?: string, 
  onClose?: () => void,
  isExpanded?: boolean,
  setIsExpanded?: (expanded: boolean) => void,
  onOpenModal: (modalType: 'project' | 'documents' | 'groups' | 'ai') => void
}) => {
  return (
    <div className={`bg-[#0a0a0a] border-r border-white/10 h-screen sticky top-0 overflow-y-auto transition-all duration-300 ${className} ${
      isExpanded ? 'w-[88px] lg:w-[260px]' : 'w-[88px]'
    }`}>
      {onClose && (
        <div className="flex justify-end mb-4 lg:hidden p-4">
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white">
            <X size={20} />
          </button>
        </div>
      )}
      
      {/* Toggle Button */}
      {setIsExpanded && (
        <div className="p-4">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            {isExpanded ? <ChevronLeft size={16} /> : <ChevronRightIcon size={16} />}
          </button>
        </div>
      )}

      {/* Contract Controls */}
      <div className="px-4 space-y-2">
        {/* Project Details */}
        <button
          onClick={() => onOpenModal('project')}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#111] border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all text-left group"
        >
          <FileText className="w-5 h-5 text-[#E70008] flex-shrink-0" />
          <div className={`flex-1 min-w-0 hidden ${isExpanded ? 'lg:block' : ''}`}>
            <h3 className="text-white font-medium text-sm truncate">{contract.title}</h3>
            <p className="text-xs text-gray-400">Project Details</p>
          </div>
          <ChevronRightIcon className={`w-4 h-4 text-gray-500 hidden ${isExpanded ? 'lg:block' : ''}`} />
        </button>

        {/* Documents */}
        <button
          onClick={() => onOpenModal('documents')}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#111] border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all text-left group"
        >
          <FolderOpen className="w-5 h-5 text-[#E70008] flex-shrink-0" />
          <div className={`flex-1 min-w-0 hidden ${isExpanded ? 'lg:block' : ''}`}>
            <h3 className="text-white font-medium text-sm">Documents</h3>
            <p className="text-xs text-gray-400">6 files</p>
          </div>
          <ChevronRightIcon className={`w-4 h-4 text-gray-500 hidden ${isExpanded ? 'lg:block' : ''}`} />
        </button>

        {/* Groups */}
        <button
          onClick={() => onOpenModal('groups')}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#111] border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all text-left group"
        >
          <Users className="w-5 h-5 text-[#E70008] flex-shrink-0" />
          <div className={`flex-1 min-w-0 hidden ${isExpanded ? 'lg:block' : ''}`}>
            <h3 className="text-white font-medium text-sm">Groups</h3>
            <p className="text-xs text-gray-400">4 groups</p>
          </div>
          <span className={`w-5 h-5 bg-[#E70008] text-white text-[10px] font-bold rounded-full flex items-center justify-center hidden ${isExpanded ? 'lg:flex' : ''}`}>
            7
          </span>
        </button>

        {/* Magna AI */}
        <button
          onClick={() => onOpenModal('ai')}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-[#E70008]/20 to-[#ff1f29]/20 border border-[#E70008]/30 hover:border-[#E70008]/50 transition-all text-left group"
        >
          <Bot className="w-5 h-5 text-[#E70008] flex-shrink-0" />
          <div className={`flex-1 min-w-0 hidden ${isExpanded ? 'lg:block' : ''}`}>
            <h3 className="text-white font-medium text-sm">Magna AI</h3>
            <p className="text-xs text-gray-400">AI Assistant</p>
          </div>
          <Sparkles className={`w-4 h-4 text-[#E70008] hidden ${isExpanded ? 'lg:block' : ''}`} />
        </button>
      </div>
    </div>
  );
};

export default function ContractPage() {
  const [contract, setContract] = useState<Contract>(mockContract);
  const [userRole, setUserRole] = useState<'CLIENT' | 'DEVELOPER' | 'ADMIN'>('CLIENT');
  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'escrow' | 'activity'>('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [contractMode, setContractMode] = useState<'view' | 'create' | 'ai'>('view');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [expandedMilestones, setExpandedMilestones] = useState<string[]>([]);
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [activeModal, setActiveModal] = useState<'project' | 'documents' | 'groups' | 'ai' | null>(null);

  // Form states
  const [submissionForm, setSubmissionForm] = useState<{
    summary: string;
    evidence: { type: EvidenceType; url: string; label: string; text?: string; fileId?: string }[];
  }>({
    summary: '',
    evidence: [{ type: 'LINK', url: '', label: '' }]
  });
  const [reviewForm, setReviewForm] = useState({
    decision: 'APPROVE' as 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES',
    comments: '',
    reasonCode: ''
  });

  // Derived state
  const nextMilestone = contract.milestones.find(m => 
    m.status === 'NOT_STARTED' || m.status === 'IN_PROGRESS'
  );
  const completedMilestones = contract.milestones.filter(m => m.status === 'RELEASED').length;
  const progressPercentage = (completedMilestones / contract.milestones.length) * 100;
  const availableBalance = (contract.escrow?.fundedTotal || 0) - (contract.escrow?.releasedTotal || 0);

  // Modal functions
  const handleOpenModal = (modalType: 'project' | 'documents' | 'groups' | 'ai') => {
    setActiveModal(modalType);
  };

  const handleCloseModal = () => {
    setActiveModal(null);
  };

  // Status helpers
  const getStatusColor = (status: ContractStatus | MilestoneStatus) => {
    const colors: Record<string, string> = {
      'DRAFT': 'bg-gray-500',
      'PENDING_DEVELOPER_ACCEPTANCE': 'bg-yellow-500',
      'ACTIVE_UNFUNDED': 'bg-orange-500',
      'ACTIVE_FUNDED': 'bg-green-500',
      'PAUSED': 'bg-red-500',
      'COMPLETED': 'bg-blue-500',
      'CANCELLED': 'bg-gray-600',
      'TERMINATED': 'bg-red-700',
      'NOT_STARTED': 'bg-gray-500',
      'IN_PROGRESS': 'bg-[#E70008]',
      'SUBMITTED': 'bg-yellow-500',
      'IN_REVIEW': 'bg-blue-500',
      'CHANGES_REQUESTED': 'bg-orange-500',
      'APPROVED': 'bg-green-500',
      'REJECTED': 'bg-red-500',
      'RELEASED': 'bg-green-600'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusLabel = (status: ContractStatus | MilestoneStatus) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // Actions
  const handleFundEscrow = () => {
    alert('Initiating M-Pesa payment for KES ' + contract.totalAmount);
  };

  const handleSubmitWork = (milestone: Milestone) => {
    if (contract.status !== 'ACTIVE_FUNDED') {
      alert('Contract must be funded before submitting work');
      return;
    }
    setSelectedMilestone(milestone);
    setShowSubmissionModal(true);
  };

  const handleSubmitEvidence = () => {
    if (!selectedMilestone) return;
    
    // Validation: Check if escrow has sufficient funds
    if (contract.escrow?.fundedTotal === 0) {
      alert('Cannot submit: Escrow not funded');
      return;
    }

    // Mock submission
    const newSubmission: ProgressSubmission = {
      id: `sub-${Date.now()}`,
      milestoneId: selectedMilestone.id,
      submittedBy: 'DEVELOPER',
      summary: submissionForm.summary,
      evidenceItems: submissionForm.evidence.filter(e => e.url || e.text).map((e, i) => ({
        id: `ev-${Date.now()}-${i}`,
        type: e.type,
        url: e.url,
        text: e.text,
        label: e.label || 'Evidence',
        createdAt: new Date().toISOString()
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Update milestone status to SUBMITTED
    const updatedMilestones = contract.milestones.map(m => 
      m.id === selectedMilestone.id 
        ? { ...m, status: 'SUBMITTED' as MilestoneStatus, currentSubmission: newSubmission }
        : m
    );

    setContract({ ...contract, milestones: updatedMilestones });
    setShowSubmissionModal(false);
    setSubmissionForm({ summary: '', evidence: [{ type: 'LINK', url: '', label: '' }] });
    alert('Work submitted successfully! Awaiting client review.');
  };

  const handleReviewMilestone = (milestone: Milestone) => {
    if (milestone.status !== 'SUBMITTED' && milestone.status !== 'CHANGES_REQUESTED') {
      alert('No submission to review');
      return;
    }
    setSelectedMilestone(milestone);
    setShowReviewModal(true);
  };

  const handleSubmitReview = () => {
    if (!selectedMilestone) return;

    const newReview: MilestoneReview = {
      id: `rev-${Date.now()}`,
      milestoneId: selectedMilestone.id,
      reviewerId: 'client-1',
      decision: reviewForm.decision,
      comments: reviewForm.comments,
      reasonCode: reviewForm.reasonCode,
      createdAt: new Date().toISOString()
    };

    let newStatus: MilestoneStatus = selectedMilestone.status;
    if (reviewForm.decision === 'APPROVE') newStatus = 'APPROVED';
    else if (reviewForm.decision === 'REJECT') newStatus = 'REJECTED';
    else if (reviewForm.decision === 'REQUEST_CHANGES') newStatus = 'CHANGES_REQUESTED';

    const updatedMilestones = contract.milestones.map(m => 
      m.id === selectedMilestone.id 
        ? { ...m, status: newStatus, reviews: [...(m.reviews || []), newReview] }
        : m
    );

    setContract({ ...contract, milestones: updatedMilestones });
    setShowReviewModal(false);
    setReviewForm({ decision: 'APPROVE', comments: '', reasonCode: '' });
  };

  const handleReleaseFunds = (milestone: Milestone) => {
    if (milestone.status !== 'APPROVED') {
      alert('Milestone must be approved before releasing funds');
      return;
    }

    // Update milestone and escrow
    const updatedMilestones = contract.milestones.map(m => 
      m.id === milestone.id ? { ...m, status: 'RELEASED' as MilestoneStatus } : m
    );

    const newTransaction: EscrowTransaction = {
      id: `tx-${Date.now()}`,
      contractId: contract.id,
      type: 'RELEASE',
      amount: milestone.amount,
      from: 'escrow',
      to: contract.developerId || 'dev-1',
      status: 'SUCCESS',
      createdAt: new Date().toISOString()
    };

    setContract({
      ...contract,
      milestones: updatedMilestones,
      escrow: {
        ...contract.escrow!,
        releasedTotal: (contract.escrow?.releasedTotal || 0) + milestone.amount
      },
      transactions: [...(contract.transactions || []), newTransaction]
    });
    alert(`Released KES ${milestone.amount.toLocaleString()} to developer`);
  };

  const toggleMilestoneExpand = (id: string) => {
    setExpandedMilestones(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const canSubmitWork = (milestone: Milestone) => {
    return userRole === 'DEVELOPER' && 
           contract.status === 'ACTIVE_FUNDED' && 
           (milestone.status === 'NOT_STARTED' || milestone.status === 'IN_PROGRESS' || milestone.status === 'CHANGES_REQUESTED');
  };

  const canReview = (milestone: Milestone) => {
    return userRole === 'CLIENT' && 
           (milestone.status === 'SUBMITTED' || milestone.status === 'CHANGES_REQUESTED');
  };

  const canRelease = (milestone: Milestone) => {
    return userRole === 'CLIENT' && milestone.status === 'APPROVED';
  };

  return (
    <div className="flex min-h-screen bg-black text-[#F9E4AD] font-sans selection:bg-[#E70008] selection:text-white">
      <LeftControlPanel 
        contract={contract} 
        isExpanded={isSidebarExpanded}
        setIsExpanded={setIsSidebarExpanded}
        onOpenModal={handleOpenModal}
        className="hidden lg:flex"
      />
      
      {/* Mobile Panel */}
      {showMobilePanel && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden">
          <LeftControlPanel 
            contract={contract}
            onClose={() => setShowMobilePanel(false)}
            onOpenModal={handleOpenModal}
            className="w-[280px]"
          />
        </div>
      )}
      
      {/* Modals */}
      <ProjectDetailsModal 
        contract={contract}
        isOpen={activeModal === 'project'}
        onClose={handleCloseModal}
      />
      <DocumentsModal 
        isOpen={activeModal === 'documents'}
        onClose={handleCloseModal}
      />
      <GroupsModal 
        isOpen={activeModal === 'groups'}
        onClose={handleCloseModal}
      />
      <MagnaAIModal 
        isOpen={activeModal === 'ai'}
        onClose={handleCloseModal}
      />
      
      <div className="flex-1 flex flex-col min-w-0 pb-24">
      {/* Role Switcher (for demo) */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        {(['CLIENT', 'DEVELOPER', 'ADMIN'] as const).map(role => (
          <button
            key={role}
            onClick={() => setUserRole(role)}
            className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${
              userRole === role 
                ? 'bg-[#E70008] text-white' 
                : 'bg-white/10 text-[#F9E4AD]/60 hover:bg-white/20'
            }`}
          >
            {role}
          </button>
        ))}
      </div>

      {/* Top Header */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex justify-between items-start mb-1">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button 
                onClick={() => setShowMobilePanel(true)}
                className="lg:hidden p-2 bg-white/5 rounded-lg text-white hover:bg-white/10"
              >
                <MoreVertical size={20} />
              </button>
              <h1 className="text-3xl font-bold tracking-tight text-white">Contract &<br/>Milestones</h1>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-3 py-1 text-xs font-bold rounded-full tracking-wide text-white ${getStatusColor(contract.status)}`}>
                {getStatusLabel(contract.status)}
              </span>
              <span className="text-xs text-[#F9E4AD]/60">
                {contract.fundingMode === 'FULL_UPFRONT' ? 'Full Upfront' : 'Milestone-based'}
              </span>
            </div>
          </div>
        </div>
        <p className="text-sm text-[#F9E4AD]/60 mb-6">Role: {userRole} • {contract.currency} {contract.totalAmount.toLocaleString()}</p>

        {/* Project Info Card - Hidden on desktop since it's in sidebar */}
        <div className="lg:hidden bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-3">{contract.title}</h3>
          <div className="space-y-2 text-sm text-[#F9E4AD]/80">
            <div className="flex justify-between">
              <span className="opacity-60">Client:</span>
              <span className="font-medium text-white">{contract.metadata.clientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-60">Developer:</span>
              <span className="font-medium text-white">{contract.metadata.developerName || 'Not assigned'}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-60">Start date:</span>
              <span>{contract.startAt ? new Date(contract.startAt).toLocaleDateString() : 'TBD'}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-60">Est. delivery:</span>
              <span>{contract.metadata.estimatedDays} days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-4 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(['overview', 'milestones', 'escrow', 'activity'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab 
                  ? 'bg-[#E70008] text-white' 
                  : 'bg-white/5 text-[#F9E4AD]/60 hover:bg-white/10'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            {/* Progress Overview */}
            <div className="bg-[#111] border border-white/10 rounded-3xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Progress Overview</h2>
                <span className="text-2xl font-bold text-white">{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mb-4">
                <div 
                  className="bg-[#E70008] h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="text-2xl font-bold text-white">{completedMilestones}</div>
                  <div className="text-xs text-[#F9E4AD]/60">Completed</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="text-2xl font-bold text-[#E70008]">
                    {contract.milestones.filter(m => m.status === 'IN_PROGRESS' || m.status === 'SUBMITTED').length}
                  </div>
                  <div className="text-xs text-[#F9E4AD]/60">Active</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3">
                  <div className="text-2xl font-bold text-white/40">
                    {contract.milestones.filter(m => m.status === 'NOT_STARTED').length}
                  </div>
                  <div className="text-xs text-[#F9E4AD]/60">Pending</div>
                </div>
              </div>
            </div>

            {/* Contract Summary */}
            <div className="bg-[#111] border border-white/10 rounded-3xl p-6 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#E70008]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-[#E70008]" />
                  <h2 className="text-xl font-bold text-white">Contract Summary</h2>
                </div>
                <button 
                  className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-[#F9E4AD] transition-colors"
                  title="Download PDF"
                >
                  <Download size={18} />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-sm text-[#F9E4AD]/60">Total Budget</span>
                  <span className="text-lg font-bold text-white">{contract.currency} {contract.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-sm text-[#F9E4AD]/60">Payment Method</span>
                  <span className="text-sm font-medium text-white">Milestones + escrow</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-sm text-[#F9E4AD]/60">Ownership</span>
                  <span className="text-sm font-medium text-white">Transfers after final payment</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-sm text-[#F9E4AD]/60">Revisions</span>
                  <span className="text-sm font-medium text-white">2 rounds per milestone</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-sm text-[#F9E4AD]/60">Support</span>
                  <span className="text-sm font-medium text-white">14 days post-delivery</span>
                </div>
                
                {contract.status === 'ACTIVE_UNFUNDED' && userRole === 'CLIENT' && (
                  <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={16} className="text-yellow-500" />
                      <span className="text-sm font-bold text-yellow-500">Action Required</span>
                    </div>
                    <p className="text-xs text-yellow-500/80 mb-3">Fund the escrow to allow developer to start work</p>
                    <button 
                      onClick={handleFundEscrow}
                      className="w-full py-2 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors"
                    >
                      Fund Escrow (KES {contract.totalAmount.toLocaleString()})
                    </button>
                  </div>
                )}

                <div className="mt-3 bg-[#E70008]/5 border border-[#E70008]/20 rounded-lg p-3">
                  <p className="text-xs text-[#E70008]/80 leading-relaxed">
                    <span className="font-bold">Late Delivery Rule:</span> Milestone delays reduce payout by 2% per day after due date.
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#F9E4AD]/60">Client Signature</span>
                  <span className="flex items-center gap-1.5 text-green-400 text-sm font-medium bg-green-400/10 px-2 py-0.5 rounded-full">
                    Signed <CheckCircle2 size={14} />
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#F9E4AD]/60">Developer Signature</span>
                  <span className={`flex items-center gap-1.5 text-sm font-medium px-2 py-0.5 rounded-full ${
                    contract.status !== 'DRAFT' && contract.status !== 'PENDING_DEVELOPER_ACCEPTANCE'
                      ? 'text-green-400 bg-green-400/10'
                      : 'text-amber-400 bg-amber-400/10'
                  }`}>
                    {contract.status !== 'DRAFT' && contract.status !== 'PENDING_DEVELOPER_ACCEPTANCE' 
                      ? <>Signed <CheckCircle2 size={14} /></>
                      : <>Pending <Clock size={14} /></>
                    }
                  </span>
                </div>
              </div>

              {contract.status === 'PENDING_DEVELOPER_ACCEPTANCE' && userRole === 'DEVELOPER' && (
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setContract({...contract, status: 'ACTIVE_UNFUNDED'})}
                    className="py-3 px-4 rounded-xl bg-[#E70008] text-white font-medium text-sm shadow-[0_0_15px_rgba(231,0,8,0.3)] hover:bg-[#c90007] transition-colors"
                  >
                    Accept Contract
                  </button>
                  <button className="py-3 px-4 rounded-xl border border-white/10 text-white font-medium text-sm hover:bg-white/5 transition-colors">
                    Decline
                  </button>
                </div>
              )}
            </div>

            {/* Current Milestone Card */}
            {nextMilestone && (
              <div className="bg-[#111] border border-[#E70008]/30 rounded-3xl p-6 shadow-[0_4px_20px_-5px_rgba(231,0,8,0.15)]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Current Milestone</h2>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold text-white ${getStatusColor(nextMilestone.status)}`}>
                    {getStatusLabel(nextMilestone.status)}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-white mb-2">{nextMilestone.title}</h3>
                <p className="text-sm text-[#F9E4AD]/60 mb-4">{nextMilestone.description}</p>
                
                <div className="bg-white/5 rounded-xl p-3 mb-4">
                  <div className="text-xs text-[#F9E4AD]/60 mb-1">Acceptance Criteria</div>
                  <p className="text-sm text-white">{nextMilestone.acceptanceCriteria}</p>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <div>
                    <div className="text-xs text-[#F9E4AD]/60">Amount</div>
                    <div className="text-xl font-bold text-white">{contract.currency} {nextMilestone.amount.toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#F9E4AD]/60">Due Date</div>
                    <div className="text-sm text-white">{new Date(nextMilestone.dueAt).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {canSubmitWork(nextMilestone) && (
                    <button 
                      onClick={() => handleSubmitWork(nextMilestone)}
                      className="flex-1 py-3 px-4 rounded-xl bg-[#E70008] text-white font-medium text-sm shadow-[0_0_15px_rgba(231,0,8,0.3)] hover:bg-[#c90007] transition-colors flex items-center justify-center gap-2"
                    >
                      <Upload size={16} /> Submit Work
                    </button>
                  )}
                  {canReview(nextMilestone) && (
                    <button 
                      onClick={() => handleReviewMilestone(nextMilestone)}
                      className="flex-1 py-3 px-4 rounded-xl bg-blue-500 text-white font-medium text-sm hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Eye size={16} /> Review Submission
                    </button>
                  )}
                  {canRelease(nextMilestone) && (
                    <button 
                      onClick={() => handleReleaseFunds(nextMilestone)}
                      className="flex-1 py-3 px-4 rounded-xl bg-green-500 text-white font-medium text-sm hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={16} /> Release Funds
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* MILESTONES TAB */}
        {activeTab === 'milestones' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">All Milestones</h2>
              <span className="text-xs text-[#F9E4AD]/40">{contract.milestones.length} Total</span>
            </div>

            <div className="relative space-y-4 pl-2">
              {/* Progress Line */}
              <div className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-white/10 rounded-full">
                <div 
                  className="w-full bg-[#E70008] rounded-full transition-all duration-500"
                  style={{ height: `${progressPercentage}%` }}
                ></div>
              </div>

              {contract.milestones.map((milestone, index) => (
                <div key={milestone.id} className="relative pl-10">
                  {/* Timeline Dot */}
                  <div className="absolute left-0 top-0 w-10 h-10 flex items-center justify-center">
                    {milestone.status === 'RELEASED' ? (
                      <div className="w-5 h-5 rounded-full bg-green-500 border-2 border-black ring-2 ring-green-500 flex items-center justify-center">
                        <CheckCircle2 size={12} className="text-black" />
                      </div>
                    ) : milestone.status === 'APPROVED' ? (
                      <div className="w-5 h-5 rounded-full bg-green-500 border-2 border-black ring-2 ring-green-500"></div>
                    ) : milestone.status === 'SUBMITTED' || milestone.status === 'IN_REVIEW' ? (
                      <div className="w-5 h-5 rounded-full bg-[#E70008] border-2 border-black ring-4 ring-[#E70008]/20 animate-pulse"></div>
                    ) : milestone.status === 'IN_PROGRESS' ? (
                      <div className="w-5 h-5 rounded-full bg-[#E70008] border-2 border-black"></div>
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-white/20 border-2 border-black"></div>
                    )}
                  </div>

                  <div 
                    className={`bg-[#111] border rounded-2xl p-4 transition-all ${
                      milestone.status === 'IN_PROGRESS' 
                        ? 'border-[#E70008]/30 shadow-[0_4px_20px_-5px_rgba(231,0,8,0.15)]' 
                        : 'border-white/10'
                    } ${milestone.status === 'NOT_STARTED' ? 'opacity-60' : ''}`}
                  >
                    <div 
                      className="flex justify-between items-start cursor-pointer"
                      onClick={() => toggleMilestoneExpand(milestone.id)}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-white">{milestone.title}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${getStatusColor(milestone.status)}`}>
                            {getStatusLabel(milestone.status)}
                          </span>
                        </div>
                        <div className="text-xs text-[#F9E4AD]/60">Due: {new Date(milestone.dueAt).toLocaleDateString()}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white">{contract.currency} {milestone.amount.toLocaleString()}</span>
                        {expandedMilestones.includes(milestone.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {expandedMilestones.includes(milestone.id) && (
                      <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                        <p className="text-sm text-[#F9E4AD]/80">{milestone.description}</p>
                        
                        <div className="bg-white/5 rounded-lg p-3">
                          <div className="text-xs text-[#F9E4AD]/60 mb-1">Acceptance Criteria</div>
                          <p className="text-sm text-white">{milestone.acceptanceCriteria}</p>
                        </div>

                        {/* Submissions */}
                        {milestone.submissions && milestone.submissions.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-xs font-bold text-[#F9E4AD]/60 uppercase tracking-wide">Submissions</div>
                            {milestone.submissions.map(sub => (
                              <div key={sub.id} className="bg-white/5 rounded-lg p-3">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-sm font-medium text-white">{sub.summary}</span>
                                  <span className="text-xs text-[#F9E4AD]/40">
                                    {new Date(sub.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {sub.evidenceItems.map(ev => (
                                    <span key={ev.id} className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 rounded text-xs text-[#F9E4AD]">
                                      {ev.type === 'LINK' && <LinkIcon size={12} />}
                                      {ev.type === 'FILE' && <FileUp size={12} />}
                                      {ev.type === 'REPO_COMMIT' && <Github size={12} />}
                                      {ev.type === 'DEMO_URL' && <Video size={12} />}
                                      {ev.type === 'SCREENSHOT' && <ImageIcon size={12} />}
                                      {ev.label}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reviews */}
                        {milestone.reviews && milestone.reviews.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-xs font-bold text-[#F9E4AD]/60 uppercase tracking-wide">Reviews</div>
                            {milestone.reviews.map(review => (
                              <div key={review.id} className={`bg-white/5 rounded-lg p-3 border-l-2 ${
                                review.decision === 'APPROVE' ? 'border-green-500' :
                                review.decision === 'REJECT' ? 'border-red-500' : 'border-yellow-500'
                              }`}>
                                <div className="flex justify-between items-start">
                                  <span className={`text-sm font-medium ${
                                    review.decision === 'APPROVE' ? 'text-green-400' :
                                    review.decision === 'REJECT' ? 'text-red-400' : 'text-yellow-400'
                                  }`}>
                                    {review.decision === 'APPROVE' ? 'Approved' :
                                     review.decision === 'REJECT' ? 'Rejected' : 'Changes Requested'}
                                  </span>
                                </div>
                                <p className="text-xs text-[#F9E4AD]/60 mt-1">{review.comments}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          {canSubmitWork(milestone) && (
                            <button 
                              onClick={() => handleSubmitWork(milestone)}
                              className="flex-1 py-2 px-3 rounded-lg bg-[#E70008]/20 border border-[#E70008]/50 text-[#E70008] text-sm font-medium hover:bg-[#E70008]/30 transition-colors"
                            >
                              Submit Work
                            </button>
                          )}
                          {canReview(milestone) && (
                            <button 
                              onClick={() => handleReviewMilestone(milestone)}
                              className="flex-1 py-2 px-3 rounded-lg bg-blue-500/20 border border-blue-500/50 text-blue-400 text-sm font-medium hover:bg-blue-500/30 transition-colors"
                            >
                              Review
                            </button>
                          )}
                          {canRelease(milestone) && (
                            <button 
                              onClick={() => handleReleaseFunds(milestone)}
                              className="flex-1 py-2 px-3 rounded-lg bg-green-500/20 border border-green-500/50 text-green-400 text-sm font-medium hover:bg-green-500/30 transition-colors"
                            >
                              Release KES {milestone.amount.toLocaleString()}
                            </button>
                          )}
                          {userRole === 'CLIENT' && milestone.status !== 'RELEASED' && (
                            <button 
                              onClick={() => setShowDisputeModal(true)}
                              className="py-2 px-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors"
                            >
                              <AlertTriangle size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ESCROW TAB */}
        {activeTab === 'escrow' && (
          <>
            <div className="bg-[#111] border border-white/10 rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <ShieldCheck size={20} className="text-[#E70008]" />
                <h2 className="text-xl font-bold text-white">Escrow Account</h2>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="text-xs text-[#F9E4AD]/60 mb-1">Total Funded</div>
                  <div className="text-2xl font-bold text-white">{contract.currency} {contract.escrow?.fundedTotal.toLocaleString()}</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="text-xs text-[#F9E4AD]/60 mb-1">Available Balance</div>
                  <div className="text-2xl font-bold text-[#E70008]">{contract.currency} {availableBalance.toLocaleString()}</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="text-xs text-[#F9E4AD]/60 mb-1">Released</div>
                  <div className="text-xl font-bold text-green-400">{contract.currency} {contract.escrow?.releasedTotal.toLocaleString()}</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="text-xs text-[#F9E4AD]/60 mb-1">Refunded</div>
                  <div className="text-xl font-bold text-white/40">{contract.currency} {contract.escrow?.refundedTotal.toLocaleString()}</div>
                </div>
              </div>

              {contract.status === 'ACTIVE_UNFUNDED' && userRole === 'CLIENT' && (
                <button 
                  onClick={handleFundEscrow}
                  className="w-full py-4 bg-[#E70008] rounded-xl text-white font-bold shadow-[0_0_15px_rgba(231,0,8,0.3)] hover:bg-[#c90007] transition-colors flex items-center justify-center gap-2 mb-4"
                >
                  <Wallet size={20} /> Fund Escrow Now
                </button>
              )}

              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-white">Escrow Status</div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    contract.escrow?.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
                    contract.escrow?.status === 'FROZEN' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {contract.escrow?.status}
                  </span>
                </div>
                <p className="text-xs text-[#F9E4AD]/60">
                  Funds are held securely until milestone approval. {contract.fundingMode === 'NEXT_MILESTONE_REQUIRED' 
                    ? 'Each milestone must be funded before work begins.' 
                    : 'Full amount funded upfront.'}
                </p>
              </div>
            </div>

            {/* Transaction History */}
            <div className="bg-[#111] border border-white/10 rounded-3xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Transaction History</h3>
              <div className="space-y-3">
                {contract.transactions?.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.type === 'FUND' ? 'bg-green-500/20 text-green-400' :
                        tx.type === 'RELEASE' ? 'bg-blue-500/20 text-blue-400' :
                        tx.type === 'REFUND' ? 'bg-red-500/20 text-red-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {tx.type === 'FUND' ? <Download size={18} /> :
                         tx.type === 'RELEASE' ? <Send size={18} /> :
                         tx.type === 'REFUND' ? <RefreshCw size={18} /> :
                         <MoreVertical size={18} />}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{tx.type}</div>
                        <div className="text-xs text-[#F9E4AD]/40">{new Date(tx.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${
                        tx.type === 'FUND' ? 'text-green-400' :
                        tx.type === 'RELEASE' || tx.type === 'REFUND' ? 'text-red-400' :
                        'text-white'
                      }`}>
                        {tx.type === 'FUND' ? '+' : '-'}{contract.currency} {tx.amount.toLocaleString()}
                      </div>
                      <div className={`text-xs ${
                        tx.status === 'SUCCESS' ? 'text-green-400' :
                        tx.status === 'PENDING' ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {tx.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ACTIVITY TAB */}
        {activeTab === 'activity' && (
          <div className="bg-[#111] border border-white/10 rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <History size={20} className="text-[#E70008]" />
              <h2 className="text-xl font-bold text-white">Activity Log</h2>
            </div>
            
            <div className="space-y-4">
              {contract.activityLogs?.map((log, index) => (
                <div key={log.id} className="relative pl-6 pb-4 border-l border-white/10 last:border-0">
                  <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-[#E70008]"></div>
                  <div className="text-xs text-[#F9E4AD]/40 mb-1">
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                  <div className="text-sm text-white font-medium">
                    {log.actionType.replace(/_/g, ' ')}
                  </div>
                  {log.payload.amount && (
                    <div className="text-xs text-[#F9E4AD]/60 mt-1">
                      Amount: {contract.currency} {log.payload.amount.toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-[#E70008] rounded-full shadow-[0_4px_20px_rgba(231,0,8,0.4)] flex items-center justify-center text-white z-40 hover:scale-105 transition-transform"
      >
        <Plus size={28} />
      </button>

      {/* Submission Modal */}
      {showSubmissionModal && selectedMilestone && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-[#111] w-full md:w-[500px] md:rounded-3xl rounded-t-3xl border border-white/10 p-6 animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Submit Work Evidence</h2>
              <button onClick={() => setShowSubmissionModal(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
                <X size={20} className="text-[#F9E4AD]" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-white/5 rounded-lg">
              <div className="text-xs text-[#F9E4AD]/60">Milestone</div>
              <div className="text-sm font-medium text-white">{selectedMilestone.title}</div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-[#F9E4AD]/80 block mb-2">Summary</label>
                <textarea 
                  className="w-full bg-black border border-white/20 rounded-xl p-3 text-white h-24 focus:border-[#E70008] focus:outline-none resize-none placeholder:text-white/20"
                  placeholder="Describe what you've completed..."
                  value={submissionForm.summary}
                  onChange={e => setSubmissionForm({...submissionForm, summary: e.target.value})}
                />
              </div>

              <div>
                <label className="text-sm text-[#F9E4AD]/80 block mb-2">Evidence</label>
                <div className="space-y-2">
                  {submissionForm.evidence.map((ev, idx) => (
                    <div key={idx} className="flex gap-2">
                      <select 
                        className="bg-black border border-white/20 rounded-lg px-2 py-2 text-sm text-white focus:border-[#E70008] focus:outline-none"
                        value={ev.type}
                        onChange={e => {
                          const newEvidence = [...submissionForm.evidence];
                          newEvidence[idx].type = e.target.value as EvidenceType;
                          setSubmissionForm({...submissionForm, evidence: newEvidence});
                        }}
                      >
                        <option value="LINK">Link</option>
                        <option value="FILE">File</option>
                        <option value="TEXT">Text</option>
                        <option value="REPO_COMMIT">Git Commit</option>
                        <option value="DEMO_URL">Demo URL</option>
                        <option value="SCREENSHOT">Screenshot</option>
                      </select>
                      <input 
                        type="text"
                        className="flex-1 bg-black border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:border-[#E70008] focus:outline-none placeholder:text-white/20"
                        placeholder={ev.type === 'TEXT' ? 'Enter text...' : 'URL or reference...'}
                        value={ev.url}
                        onChange={e => {
                          const newEvidence = [...submissionForm.evidence];
                          newEvidence[idx].url = e.target.value;
                          setSubmissionForm({...submissionForm, evidence: newEvidence});
                        }}
                      />
                      <input 
                        type="text"
                        className="w-24 bg-black border border-white/20 rounded-lg px-2 py-2 text-sm text-white focus:border-[#E70008] focus:outline-none placeholder:text-white/20"
                        placeholder="Label"
                        value={ev.label}
                        onChange={e => {
                          const newEvidence = [...submissionForm.evidence];
                          newEvidence[idx].label = e.target.value;
                          setSubmissionForm({...submissionForm, evidence: newEvidence});
                        }}
                      />
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => setSubmissionForm({
                    ...submissionForm, 
                    evidence: [...submissionForm.evidence, { type: 'LINK', url: '', label: '' }]
                  })}
                  className="mt-2 text-xs text-[#E70008] hover:underline"
                >
                  + Add more evidence
                </button>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2 text-yellow-500 text-xs">
                  <AlertCircle size={14} />
                  <span className="font-bold">Important</span>
                </div>
                <p className="text-xs text-yellow-500/80 mt-1">
                  Work cannot be submitted without funded escrow. Client will review and approve before funds are released.
                </p>
              </div>

              <button 
                onClick={handleSubmitEvidence}
                disabled={!submissionForm.summary}
                className="w-full py-4 bg-[#E70008] rounded-xl text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#c90007] transition-colors"
              >
                Submit for Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedMilestone && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-[#111] w-full md:w-[500px] md:rounded-3xl rounded-t-3xl border border-white/10 p-6 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Review Submission</h2>
              <button onClick={() => setShowReviewModal(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
                <X size={20} className="text-[#F9E4AD]" />
              </button>
            </div>

            {selectedMilestone.currentSubmission && (
              <div className="mb-6 space-y-3">
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-xs text-[#F9E4AD]/60 mb-1">Developer Submission</div>
                  <p className="text-sm text-white">{selectedMilestone.currentSubmission.summary}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedMilestone.currentSubmission.evidenceItems.map(ev => (
                    <span key={ev.id} className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 rounded text-xs text-[#F9E4AD]">
                      {ev.type === 'LINK' && <LinkIcon size={12} />}
                      {ev.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-sm text-[#F9E4AD]/80 block mb-2">Decision</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['APPROVE', 'REQUEST_CHANGES', 'REJECT'] as const).map(decision => (
                    <button
                      key={decision}
                      onClick={() => setReviewForm({...reviewForm, decision})}
                      className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        reviewForm.decision === decision
                          ? decision === 'APPROVE' ? 'bg-green-500 text-white' :
                            decision === 'REJECT' ? 'bg-red-500 text-white' :
                            'bg-yellow-500 text-black'
                          : 'bg-white/5 text-[#F9E4AD] hover:bg-white/10'
                      }`}
                    >
                      {decision === 'APPROVE' ? 'Approve' : 
                       decision === 'REJECT' ? 'Reject' : 'Changes'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-[#F9E4AD]/80 block mb-2">Comments</label>
                <textarea 
                  className="w-full bg-black border border-white/20 rounded-xl p-3 text-white h-24 focus:border-[#E70008] focus:outline-none resize-none placeholder:text-white/20"
                  placeholder="Provide feedback..."
                  value={reviewForm.comments}
                  onChange={e => setReviewForm({...reviewForm, comments: e.target.value})}
                />
              </div>

              {reviewForm.decision === 'REQUEST_CHANGES' && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                  <p className="text-xs text-yellow-500/80">
                    Developer will be notified to resubmit after making changes.
                  </p>
                </div>
              )}

              {reviewForm.decision === 'APPROVE' && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <p className="text-xs text-green-400">
                    Approving will release KES {selectedMilestone.amount.toLocaleString()} to the developer.
                  </p>
                </div>
              )}

              <button 
                onClick={handleSubmitReview}
                disabled={!reviewForm.comments}
                className="w-full py-4 bg-[#E70008] rounded-xl text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#c90007] transition-colors"
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-[#111] w-full md:w-[500px] md:rounded-3xl rounded-t-3xl border border-white/10 p-6 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Open Dispute</h2>
              <button onClick={() => setShowDisputeModal(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10">
                <X size={20} className="text-[#F9E4AD]" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-400 mb-2">
                  <AlertTriangle size={20} />
                  <span className="font-bold">Warning</span>
                </div>
                <p className="text-sm text-red-400/80">
                  Opening a dispute will pause the contract and freeze escrow funds. An admin will review the case.
                </p>
              </div>

              <div>
                <label className="text-sm text-[#F9E4AD]/80 block mb-2">Reason for Dispute</label>
                <select className="w-full bg-black border border-white/20 rounded-xl p-3 text-white focus:border-[#E70008] focus:outline-none">
                  <option>Work not delivered as agreed</option>
                  <option>Quality does not meet criteria</option>
                  <option>Milestone deadline missed</option>
                  <option>Scope disagreement</option>
                  <option>Communication issues</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-[#F9E4AD]/80 block mb-2">Detailed Description</label>
                <textarea 
                  className="w-full bg-black border border-white/20 rounded-xl p-3 text-white h-32 focus:border-[#E70008] focus:outline-none resize-none placeholder:text-white/20"
                  placeholder="Describe the issue in detail..."
                />
              </div>

              <div>
                <label className="text-sm text-[#F9E4AD]/80 block mb-2">Evidence (Optional)</label>
                <button className="w-full py-3 border border-dashed border-white/20 rounded-xl text-[#F9E4AD]/60 hover:bg-white/5 transition-colors flex items-center justify-center gap-2">
                  <Upload size={18} /> Upload Files
                </button>
              </div>

              <button 
                onClick={() => {
                  setShowDisputeModal(false);
                  alert('Dispute opened. Contract paused pending admin review.');
                }}
                className="w-full py-4 bg-red-500 rounded-xl text-white font-bold hover:bg-red-600 transition-colors"
              >
                Open Dispute & Pause Contract
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Contract Modal (Original) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-[#111] w-full md:w-[500px] md:rounded-3xl rounded-t-3xl border border-white/10 p-6 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Create New Contract</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-2 bg-white/5 rounded-full hover:bg-white/10"
              >
                <X size={20} className="text-[#F9E4AD]" />
              </button>
            </div>

            {contractMode === 'view' && (
              <div className="space-y-4">
                <button 
                  onClick={() => setContractMode('ai')}
                  className="w-full bg-gradient-to-r from-[#E70008]/20 to-[#FF9940]/20 border border-[#E70008]/50 rounded-xl p-4 flex items-center justify-between group hover:border-[#E70008] transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#E70008]/20 flex items-center justify-center text-[#E70008]">
                      <Bot size={24} />
                    </div>
                    <div className="text-left">
                      <div className="text-white font-bold">AI Contract Generator</div>
                      <div className="text-xs text-[#F9E4AD]/60">Auto-draft terms based on project description</div>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-[#F9E4AD]/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>

                <button 
                  onClick={() => setContractMode('create')}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between group hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white">
                      <FileText size={24} />
                    </div>
                    <div className="text-left">
                      <div className="text-white font-bold">Manual Draft</div>
                      <div className="text-xs text-[#F9E4AD]/60">Write your own terms from scratch</div>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-[#F9E4AD]/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            )}

            {contractMode === 'ai' && (
              <div className="space-y-6">
                {!isGenerating ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm text-[#F9E4AD]/80">Project Description</label>
                      <textarea 
                        className="w-full bg-black border border-white/20 rounded-xl p-3 text-white h-32 focus:border-[#E70008] focus:outline-none resize-none placeholder:text-white/20"
                        placeholder="e.g. Build a mobile app for shift booking with 3 milestones: Design, MVP, and Handover..."
                      ></textarea>
                    </div>
                    <button 
                      onClick={() => {
                        setIsGenerating(true);
                        setTimeout(() => {
                          setIsGenerating(false);
                          setContractMode('view');
                          setShowCreateModal(false);
                        }, 3000);
                      }}
                      className="w-full py-4 bg-[#E70008] rounded-xl text-white font-bold flex items-center justify-center gap-2 hover:bg-[#c90007] transition-colors"
                    >
                      <Sparkles size={18} /> Generate Contract
                    </button>
                  </>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 border-4 border-[#E70008]/30 border-t-[#E70008] rounded-full animate-spin mb-4"></div>
                    <h3 className="text-lg font-bold text-white mb-1">AI is drafting your contract...</h3>
                    <p className="text-sm text-[#F9E4AD]/60">Analyzing project scope & milestones</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}