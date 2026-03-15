import React, { useState, useRef } from 'react';
import { X, Key, Link, Shield, PlusCircle, Trash2, Zap, User as UserIcon, Download, Upload, RefreshCcw } from 'lucide-react';
import { Integration, Arc, UserState } from '../types';
import MyState from './MyState';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  integrations: Integration[];
  onIntegrationToggle: (id: string) => void;
  allArcs: Arc[];
  activeArcId: string | null;
  onSetActiveArc: (id: string | null) => void;
  onDeleteArc: (id: string) => void;
  onOpenArcModal: () => void;
  userState: UserState;
  onUpdateUserState: (newState: UserState) => void;
  onDownloadBackup: () => void;
  onUploadBackup: (file: File) => void;
  onResetData: () => void;
  userName?: string;
  userPicture?: string | null;
  onProfilePictureChange: (dataUrl: string | null) => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, integrations, onIntegrationToggle, allArcs, activeArcId, onSetActiveArc, onDeleteArc, onOpenArcModal, userState, onUpdateUserState, onDownloadBackup, onUploadBackup, onResetData, userName, userPicture, onProfilePictureChange, apiKey, onSaveApiKey }) => {
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const fileInputRef = useRef<HTMLInputElement>(null);
  if (!isOpen) return null;
  
  const handleProfilePicClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onProfilePictureChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-primary rounded-lg p-6 w-full max-w-2xl relative border border-border-color max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: #30363D;
            border-radius: 20px;
            border: 3px solid #161B22;
          }
        `}</style>
        <button onClick={onClose} className="absolute top-4 right-4 text-text-secondary hover:text-white">
          <X className="w-6 h-6" />
        </button>

        {/* Account Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-text-primary flex items-center"><UserIcon className="w-5 h-5 mr-3" />Account</h2>
          <div className="bg-background p-4 rounded-lg border border-border-color flex items-center justify-between">
              <div className="flex items-center space-x-4">
                  <div className="relative group">
                    <img 
                        src={userPicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'User')}&background=0D8ABC&color=fff`} 
                        alt="User profile" 
                        className="w-16 h-16 rounded-full object-cover cursor-pointer"
                        onClick={handleProfilePicClick}
                    />
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs font-bold">Change</p>
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/png, image/jpeg, image/gif"
                      onChange={handleFileChange}
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">Player: <span className="text-accent-primary">{userName || 'Adventurer'}</span></p>
                    <div className="flex items-center space-x-4 mt-2">
                        <button onClick={handleProfilePicClick} className="text-xs text-accent-primary hover:underline flex items-center gap-1">
                            <Upload size={12}/>
                            <span>Upload Picture</span>
                        </button>
                        <button onClick={() => onProfilePictureChange(null)} className="text-xs text-accent-red hover:underline flex items-center gap-1">
                            <RefreshCcw size={12}/> Reset Picture
                        </button>
                    </div>
                  </div>
              </div>
          </div>
        </div>

        {/* API Key Section */}
        <div className="mt-8 pt-6 border-t border-border-color">
           <h3 className="text-xl font-semibold text-text-primary mb-4 flex items-center"><Key className="w-5 h-5 mr-3" />API Key</h3>
           <div className="bg-background p-4 rounded-lg border border-border-color">
                 <p className="text-sm text-text-secondary mb-2">Provide your Google AI API key to power all AI features.</p>
                 <div className="flex items-center space-x-2">
                     <input
                         type="password"
                         value={localApiKey}
                         onChange={(e) => setLocalApiKey(e.target.value)}
                         placeholder="Your Google AI API key"
                         className="flex-grow bg-primary border border-border-color rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                     />
                     <button
                         onClick={() => onSaveApiKey(localApiKey)}
                         className="bg-accent-primary hover:bg-opacity-80 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                     >
                         Save Key
                     </button>
                 </div>
                 <p className="text-xs text-text-muted mt-2">
                    Your key is stored only in your browser. Get one from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent-primary">Google AI Studio</a>.
                 </p>
           </div>
        </div>

        {/* Arc Management Section */}
        <div className="mt-8 pt-6 border-t border-border-color">
            <h2 className="text-xl font-semibold mb-6 text-text-primary flex items-center"><Shield className="w-5 h-5 mr-3" />Arc Management</h2>
            <div className="space-y-3 mb-6">
                {allArcs.map(arc => {
                    const isActive = activeArcId === arc.id;
                    return (
                        <div key={arc.id} className="bg-background p-4 rounded-lg border border-border-color">
                            <div className="flex justify-between items-start">
                                <div className="flex-grow">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <h4 className="font-bold text-text-primary">{arc.title}</h4>
                                        {isActive && <span className="text-xs font-semibold px-2 py-0.5 rounded-full border border-border-color text-text-secondary">Active</span>}
                                    </div>
                                    <p className="text-sm text-text-secondary">{arc.description}</p>
                                </div>
                                <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                                    {arc.isGenerated !== undefined && (
                                        <button onClick={() => onDeleteArc(arc.id)} className="p-1.5 text-text-secondary hover:text-accent-red rounded-full hover:bg-accent-red/20"><Trash2 size={16}/></button>
                                    )}
                                    {!isActive && <button onClick={() => onSetActiveArc(arc.id)} className="text-sm font-semibold text-accent-primary hover:underline">Activate</button>}
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 text-sm">
                                {arc.effects.map((effect, index) => {
                                    const isPositive = effect.toLowerCase().includes('xp') || effect.toLowerCase().includes('lootbox');
                                    return (
                                    <div key={index} className={`flex items-center ${isPositive ? 'text-accent-primary' : 'text-accent-secondary'}`}>
                                        <Zap size={14} className="mr-1.5"/>
                                        <span>{effect}</span>
                                    </div>
                                )})}
                            </div>
                        </div>
                    )
                })}
            </div>
            <div className="flex justify-between items-center mt-4">
                <button onClick={() => onSetActiveArc(null)} disabled={!activeArcId} className="text-sm font-semibold px-4 py-2 rounded-lg bg-accent-red text-white hover:bg-opacity-90 disabled:bg-text-muted disabled:cursor-not-allowed">Deactivate Arc</button>
                <button onClick={onOpenArcModal} className="flex items-center space-x-2 text-sm font-semibold px-4 py-2 rounded-lg bg-accent-green text-white hover:bg-accent-green-hover"><PlusCircle size={18}/><span>Create New Arc</span></button>
            </div>
        </div>
        
        {/* My State Section */}
        <div className="mt-8 pt-6 border-t border-border-color">
            <MyState initialState={userState} onSave={onUpdateUserState} />
        </div>

        {/* Integrations Section */}
        <div className="mt-8 pt-6 border-t border-border-color">
           <h3 className="text-xl font-semibold text-text-primary mb-4 flex items-center"><Link className="w-5 h-5 mr-3" />Integrations</h3>
           <div className="space-y-3">
                {integrations.map(integration => (
                     <div key={integration.id} className="flex items-center justify-between bg-background p-4 rounded-lg border border-border-color">
                         <div>
                             <p className="font-semibold text-text-primary">{integration.name}</p>
                             <p className="text-sm text-text-secondary">{integration.description}</p>
                         </div>
                         <button 
                            onClick={() => onIntegrationToggle(integration.id)}
                            className={`px-4 py-1.5 text-sm font-semibold rounded-full border ${integration.connected ? 'border-accent-green text-accent-green' : 'border-border-color text-text-primary hover:bg-border-color'}`}
                        >
                            {integration.connected ? 'Connected' : 'Connect'}
                         </button>
                     </div>
                ))}
           </div>
        </div>

        {/* Data Management Section */}
        <div className="mt-8 pt-6 border-t border-border-color">
           <h3 className="text-xl font-semibold text-text-primary mb-4 flex items-center"><Download className="w-5 h-5 mr-3" />Data Management</h3>
           <div className="space-y-3">
             <div className="bg-background p-4 rounded-lg border border-border-color flex items-center justify-between">
                <div>
                     <p className="font-semibold text-text-primary">Download Backup</p>
                     <p className="text-sm text-text-secondary">Save a JSON file of all your current progress and settings.</p>
                </div>
                <button 
                    onClick={onDownloadBackup}
                    className="bg-accent-primary hover:bg-opacity-80 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                >
                    Download
                </button>
             </div>
             <div className="bg-background p-4 rounded-lg border border-border-color flex items-center justify-between">
                <div>
                     <p className="font-semibold text-text-primary">Restore from Backup</p>
                     <p className="text-sm text-text-secondary">Load progress from a backup file. This will overwrite current data.</p>
                </div>
                <label className="bg-accent-secondary hover:bg-opacity-80 text-background font-semibold py-2 px-4 rounded-lg transition-colors text-sm flex items-center space-x-2 cursor-pointer">
                    <Upload size={16} />
                    <span>Upload</span>
                    <input
                        type="file"
                        id="backup-upload"
                        accept=".json,application/json"
                        className="hidden"
                        onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                                onUploadBackup(e.target.files[0]);
                                e.target.value = '';
                            }
                        }}
                    />
                </label>
             </div>
             <div className="bg-background p-4 rounded-lg border border-accent-red flex items-center justify-between">
                <div>
                     <p className="font-semibold text-accent-red">Reset Progress</p>
                     <p className="text-sm text-text-secondary">Delete all saved data for this profile. This cannot be undone.</p>
                </div>
                <button 
                    onClick={onResetData}
                    className="bg-accent-red hover:bg-opacity-80 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                >
                    Reset
                </button>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;