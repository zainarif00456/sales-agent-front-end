import { motion } from 'framer-motion';
import {
    User, Briefcase, Building2, MapPin, Mail, Phone,
    Linkedin, Globe, Target, TrendingUp, DollarSign, CheckCircle2
} from 'lucide-react';
import { ClientProfile } from '@/services/conversation.service';

interface ClientProfileDisplayProps {
    profile: ClientProfile;
    compact?: boolean;
}

export const ClientProfileDisplay = ({ profile, compact = false }: ClientProfileDisplayProps) => {
    if (!profile || Object.keys(profile).length === 0) {
        return null;
    }

    if (compact) {
        return (
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full"
            >
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm font-semibold text-green-500">
                    Client Profile Extracted: {profile.name || 'Unknown'}
                </span>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-6 space-y-6"
        >
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <User className="w-5 h-5 text-[var(--accent-primary)]" />
                        Client Profile
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                        Automatically extracted from uploaded document
                    </p>
                </div>
                <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                    <span className="text-xs font-semibold text-green-500">Extracted</span>
                </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-3">
                {profile.name && (
                    <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-[var(--text-secondary)]" />
                        <div>
                            <p className="text-sm text-[var(--text-secondary)]">Name</p>
                            <p className="font-semibold text-[var(--text-primary)]">{profile.name}</p>
                        </div>
                    </div>
                )}

                {profile.role && (
                    <div className="flex items-center gap-3">
                        <Briefcase className="w-4 h-4 text-[var(--text-secondary)]" />
                        <div>
                            <p className="text-sm text-[var(--text-secondary)]">Role</p>
                            <p className="font-semibold text-[var(--text-primary)]">{profile.role}</p>
                        </div>
                    </div>
                )}

                {profile.company && (
                    <div className="flex items-center gap-3">
                        <Building2 className="w-4 h-4 text-[var(--text-secondary)]" />
                        <div>
                            <p className="text-sm text-[var(--text-secondary)]">Company</p>
                            <p className="font-semibold text-[var(--text-primary)]">{profile.company}</p>
                        </div>
                    </div>
                )}

                {profile.location && (
                    <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-[var(--text-secondary)]" />
                        <div>
                            <p className="text-sm text-[var(--text-secondary)]">Location</p>
                            <p className="font-semibold text-[var(--text-primary)]">{profile.location}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Contact Info */}
            {(profile.email || profile.phone || profile.linkedin || profile.website) && (
                <div className="space-y-3 pt-4 border-t border-[var(--border-color)]">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">Contact Information</h4>

                    {profile.email && (
                        <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-[var(--text-secondary)]" />
                            <a href={`mailto:${profile.email}`} className="text-sm text-[var(--accent-primary)] hover:underline">
                                {profile.email}
                            </a>
                        </div>
                    )}

                    {profile.phone && (
                        <div className="flex items-center gap-3">
                            <Phone className="w-4 h-4 text-[var(--text-secondary)]" />
                            <a href={`tel:${profile.phone}`} className="text-sm text-[var(--accent-primary)] hover:underline">
                                {profile.phone}
                            </a>
                        </div>
                    )}

                    {profile.linkedin && (
                        <div className="flex items-center gap-3">
                            <Linkedin className="w-4 h-4 text-[var(--text-secondary)]" />
                            <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--accent-primary)] hover:underline">
                                LinkedIn Profile
                            </a>
                        </div>
                    )}

                    {profile.website && (
                        <div className="flex items-center gap-3">
                            <Globe className="w-4 h-4 text-[var(--text-secondary)]" />
                            <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--accent-primary)] hover:underline">
                                {profile.website}
                            </a>
                        </div>
                    )}
                </div>
            )}

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-[var(--border-color)]">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                        {profile.skills.map((skill, index) => (
                            <span
                                key={index}
                                className="px-3 py-1 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] rounded-full text-xs font-semibold"
                            >
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Pain Points */}
            {profile.pain_points && profile.pain_points.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-[var(--border-color)]">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Potential Needs
                    </h4>
                    <ul className="space-y-2">
                        {profile.pain_points.map((point, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                                <span className="text-[var(--accent-primary)] mt-1">•</span>
                                <span>{point}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Interests */}
            {profile.interests && profile.interests.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-[var(--border-color)]">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">Interests</h4>
                    <div className="flex flex-wrap gap-2">
                        {profile.interests.map((interest, index) => (
                            <span
                                key={index}
                                className="px-3 py-1 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-full text-xs"
                            >
                                {interest}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Additional Info */}
            {(profile.company_size || profile.budget_indicators || profile.decision_maker !== undefined) && (
                <div className="space-y-3 pt-4 border-t border-[var(--border-color)]">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">Additional Information</h4>

                    {profile.company_size && (
                        <div className="flex items-center gap-3">
                            <TrendingUp className="w-4 h-4 text-[var(--text-secondary)]" />
                            <div>
                                <p className="text-sm text-[var(--text-secondary)]">Company Size</p>
                                <p className="font-semibold text-[var(--text-primary)]">{profile.company_size}</p>
                            </div>
                        </div>
                    )}

                    {profile.budget_indicators && (
                        <div className="flex items-center gap-3">
                            <DollarSign className="w-4 h-4 text-[var(--text-secondary)]" />
                            <div>
                                <p className="text-sm text-[var(--text-secondary)]">Budget Indicators</p>
                                <p className="font-semibold text-[var(--text-primary)]">{profile.budget_indicators}</p>
                            </div>
                        </div>
                    )}

                    {profile.decision_maker !== undefined && (
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-4 h-4 text-[var(--text-secondary)]" />
                            <div>
                                <p className="text-sm text-[var(--text-secondary)]">Decision Maker</p>
                                <p className="font-semibold text-[var(--text-primary)]">
                                    {profile.decision_maker ? 'Yes' : 'No'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Summary */}
            {profile.summary && (
                <div className="space-y-3 pt-4 border-t border-[var(--border-color)]">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">Summary</h4>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                        {profile.summary}
                    </p>
                </div>
            )}

            {/* Background */}
            {profile.background && (
                <div className="space-y-3 pt-4 border-t border-[var(--border-color)]">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">Background</h4>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                        {profile.background}
                    </p>
                </div>
            )}
        </motion.div>
    );
};
