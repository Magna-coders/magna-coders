import React from 'react';
import { X, FileText, Download, Eye, Upload } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  date: string;
  url?: string;
}

interface DocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents?: Document[];
}

const defaultDocuments: Document[] = [
  { id: '1', name: 'Magna Contract Terms', type: 'PDF', size: '2.4 MB', date: 'Feb 15, 2026' },
  { id: '2', name: 'Project Requirements', type: 'DOCX', size: '1.8 MB', date: 'Feb 16, 2026' },
  { id: '3', name: 'Technical Specification', type: 'PDF', size: '4.2 MB', date: 'Feb 18, 2026' },
  { id: '4', name: 'NDA Agreement', type: 'PDF', size: '1.1 MB', date: 'Feb 15, 2026' },
  { id: '5', name: 'Wireframes', type: 'PNG', size: '3.7 MB', date: 'Feb 20, 2026' },
  { id: '6', name: 'Database Schema', type: 'PDF', size: '890 KB', date: 'Feb 22, 2026' }
];

export const DocumentsModal: React.FC<DocumentsModalProps> = ({ 
  isOpen, 
  onClose, 
  documents = defaultDocuments 
}) => {
  if (!isOpen) return null;

  const handleDownload = (doc: Document) => {
    // Simulate download
    console.log(`Downloading ${doc.name}...`);
  };

  const handleView = (doc: Document) => {
    // Simulate view
    console.log(`Viewing ${doc.name}...`);
  };

  const handleUpload = () => {
    // Simulate upload
    console.log('Opening upload dialog...');
  };

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-5 h-5" />;
      case 'docx':
      case 'doc':
        return <FileText className="w-5 h-5" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
        return <FileText className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getFileColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return 'text-red-500 bg-red-500/10';
      case 'docx':
      case 'doc':
        return 'text-blue-500 bg-blue-500/10';
      case 'png':
      case 'jpg':
      case 'jpeg':
        return 'text-green-500 bg-green-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white">Project Documents</h2>
            <p className="text-sm text-gray-400 mt-1">{documents.length} documents in this project</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleUpload}
              className="px-4 py-2 rounded-lg bg-[#E70008] hover:bg-[#ff1f29] text-white transition-colors flex items-center gap-2"
            >
              <Upload size={16} />
              Upload
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => (
              <div 
                key={doc.id}
                className="group bg-[#0a0a0a] border border-white/5 rounded-xl p-4 hover:border-white/10 hover:bg-white/5 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getFileColor(doc.type)}`}>
                    {getFileIcon(doc.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate group-hover:text-[#E70008] transition-colors">
                      {doc.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <span>{doc.type}</span>
                      <span>•</span>
                      <span>{doc.size}</span>
                      <span>•</span>
                      <span>{doc.date}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-4">
                  <button 
                    onClick={() => handleView(doc)}
                    className="flex-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Eye size={14} />
                    View
                  </button>
                  <button 
                    onClick={() => handleDownload(doc)}
                    className="flex-1 px-3 py-2 rounded-lg bg-[#E70008] hover:bg-[#ff1f29] text-white transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Download size={14} />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>

          {documents.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-400 mb-2">No documents yet</h3>
              <p className="text-gray-500 mb-6">Upload your first document to get started</p>
              <button 
                onClick={handleUpload}
                className="px-6 py-3 rounded-lg bg-[#E70008] hover:bg-[#ff1f29] text-white transition-colors"
              >
                Upload Document
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10">
          <p className="text-sm text-gray-500">
            Total size: {documents.reduce((acc, doc) => acc + parseFloat(doc.size), 0).toFixed(1)} MB
          </p>
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};