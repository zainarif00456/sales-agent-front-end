import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Briefcase, Code, FolderGit2, GraduationCap, Plus, Edit2, Trash2,
    Calendar, Award, ExternalLink, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import resumeDataService, {
    AgentExperience, AgentSkill, AgentProject, AgentEducation
} from '@/services/resume-data.service';

interface StructuredDataViewerProps {
    agentId: string;
}

type DataTab = 'experience' | 'skills' | 'projects' | 'education';

export const StructuredDataViewer = ({ agentId }: StructuredDataViewerProps) => {
    const [activeTab, setActiveTab] = useState<DataTab>('experience');
    const queryClient = useQueryClient();

    // Fetch all data
    const { data: experiences, isLoading: loadingExp } = useQuery({
        queryKey: ['experiences', agentId],
        queryFn: () => resumeDataService.getExperiences(agentId),
    });

    const { data: skills, isLoading: loadingSkills } = useQuery({
        queryKey: ['skills', agentId],
        queryFn: () => resumeDataService.getSkills(agentId),
    });

    const { data: projects, isLoading: loadingProjects } = useQuery({
        queryKey: ['projects', agentId],
        queryFn: () => resumeDataService.getProjects(agentId),
    });

    const { data: education, isLoading: loadingEdu } = useQuery({
        queryKey: ['education', agentId],
        queryFn: () => resumeDataService.getEducation(agentId),
    });

    // Delete mutations
    const deleteExpMutation = useMutation({
        mutationFn: resumeDataService.deleteExperience,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['experiences', agentId] });
            toast.success('Experience deleted');
        },
    });

    const deleteSkillMutation = useMutation({
        mutationFn: resumeDataService.deleteSkill,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['skills', agentId] });
            toast.success('Skill deleted');
        },
    });

    const deleteProjectMutation = useMutation({
        mutationFn: resumeDataService.deleteProject,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', agentId] });
            toast.success('Project deleted');
        },
    });

    const deleteEduMutation = useMutation({
        mutationFn: resumeDataService.deleteEducation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['education', agentId] });
            toast.success('Education deleted');
        },
    });

    const tabs = [
        { id: 'experience' as DataTab, label: 'Experience', icon: Briefcase, count: experiences?.results?.length || 0 },
        { id: 'skills' as DataTab, label: 'Skills', icon: Code, count: skills?.results?.length || 0 },
        { id: 'projects' as DataTab, label: 'Projects', icon: FolderGit2, count: projects?.results?.length || 0 },
        { id: 'education' as DataTab, label: 'Education', icon: GraduationCap, count: education?.results?.length || 0 },
    ];

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            programming: 'bg-blue-500/20 text-blue-500',
            framework: 'bg-purple-500/20 text-purple-500',
            database: 'bg-green-500/20 text-green-500',
            cloud: 'bg-orange-500/20 text-orange-500',
            tool: 'bg-pink-500/20 text-pink-500',
            soft: 'bg-yellow-500/20 text-yellow-500',
            other: 'bg-gray-500/20 text-gray-500',
        };
        return colors[category] || colors.other;
    };

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="card p-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${activeTab === tab.id
                                        ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white'
                                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="hidden md:inline">{tab.label}</span>
                                <span className="md:hidden">{tab.label.slice(0, 3)}</span>
                                <span className="px-2 py-0.5 rounded-full text-xs bg-white/20">
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'experience' && (
                    <motion.div
                        key="experience"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4"
                    >
                        {loadingExp ? (
                            <div className="card p-8 text-center">
                                <p className="text-[var(--text-secondary)]">Loading experiences...</p>
                            </div>
                        ) : experiences?.results?.length > 0 ? (
                            experiences.results.map((exp: AgentExperience) => (
                                <div key={exp.id} className="card p-6 hover:shadow-lg transition-shadow">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">
                                                {exp.position}
                                            </h3>
                                            <p className="text-[var(--accent-primary)] font-semibold mb-2">
                                                {exp.company}
                                            </p>
                                            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                                <Calendar className="w-4 h-4" />
                                                <span>
                                                    {exp.start_date} - {exp.is_current ? 'Present' : exp.end_date}
                                                </span>
                                                {exp.is_current && (
                                                    <span className="px-2 py-0.5 bg-green-500/20 text-green-500 rounded-full text-xs font-semibold">
                                                        Current
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors">
                                                <Edit2 className="w-4 h-4 text-[var(--text-secondary)]" />
                                            </button>
                                            <button
                                                onClick={() => deleteExpMutation.mutate(exp.id)}
                                                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </button>
                                        </div>
                                    </div>

                                    <p className="text-[var(--text-primary)] mb-4">{exp.description}</p>

                                    {exp.achievements && exp.achievements.length > 0 && (
                                        <div className="mb-4">
                                            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                                                <Award className="w-4 h-4" />
                                                Key Achievements
                                            </h4>
                                            <ul className="space-y-1">
                                                {exp.achievements.map((achievement, idx) => (
                                                    <li key={idx} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                                                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                                        <span>{achievement}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {exp.technologies && exp.technologies.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {exp.technologies.map((tech) => (
                                                <span
                                                    key={tech}
                                                    className="px-3 py-1 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] rounded-full text-xs font-semibold"
                                                >
                                                    {tech}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="card p-12 text-center">
                                <Briefcase className="w-16 h-16 mx-auto mb-4 text-[var(--text-secondary)]" />
                                <p className="text-[var(--text-secondary)] mb-4">No work experience added yet</p>
                                <button className="btn-primary flex items-center gap-2 mx-auto">
                                    <Plus className="w-4 h-4" />
                                    Add Experience
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'skills' && (
                    <motion.div
                        key="skills"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        {loadingSkills ? (
                            <div className="card p-8 text-center">
                                <p className="text-[var(--text-secondary)]">Loading skills...</p>
                            </div>
                        ) : skills?.results?.length > 0 ? (
                            <div className="card p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {skills.results.map((skill: AgentSkill) => (
                                        <div
                                            key={skill.id}
                                            className="p-4 bg-[var(--bg-tertiary)] rounded-lg hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-[var(--text-primary)] mb-1">
                                                        {skill.name}
                                                    </h4>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getCategoryColor(skill.category)}`}>
                                                        {skill.category}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => deleteSkillMutation.mutate(skill.id)}
                                                    className="p-1 hover:bg-red-500/10 rounded transition-colors"
                                                >
                                                    <Trash2 className="w-3 h-3 text-red-500" />
                                                </button>
                                            </div>
                                            <div className="mt-3 space-y-1 text-sm text-[var(--text-secondary)]">
                                                <p>Proficiency: <span className="font-semibold text-[var(--text-primary)]">{skill.proficiency}</span></p>
                                                {skill.years_of_experience && (
                                                    <p>Experience: <span className="font-semibold text-[var(--text-primary)]">{skill.years_of_experience} years</span></p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="card p-12 text-center">
                                <Code className="w-16 h-16 mx-auto mb-4 text-[var(--text-secondary)]" />
                                <p className="text-[var(--text-secondary)] mb-4">No skills added yet</p>
                                <button className="btn-primary flex items-center gap-2 mx-auto">
                                    <Plus className="w-4 h-4" />
                                    Add Skill
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'projects' && (
                    <motion.div
                        key="projects"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4"
                    >
                        {loadingProjects ? (
                            <div className="card p-8 text-center">
                                <p className="text-[var(--text-secondary)]">Loading projects...</p>
                            </div>
                        ) : projects?.results?.length > 0 ? (
                            projects.results.map((project: AgentProject) => (
                                <div key={project.id} className="card p-6 hover:shadow-lg transition-shadow">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                                                {project.name}
                                            </h3>
                                            <p className="text-sm text-[var(--text-secondary)] mb-2">
                                                <span className="font-semibold">Role:</span> {project.role}
                                            </p>
                                            {(project.start_date || project.end_date) && (
                                                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-3">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>
                                                        {project.start_date} {project.end_date && `- ${project.end_date}`}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            {project.url && (
                                                <a
                                                    href={project.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                                                >
                                                    <ExternalLink className="w-4 h-4 text-[var(--accent-primary)]" />
                                                </a>
                                            )}
                                            <button className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors">
                                                <Edit2 className="w-4 h-4 text-[var(--text-secondary)]" />
                                            </button>
                                            <button
                                                onClick={() => deleteProjectMutation.mutate(project.id)}
                                                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </button>
                                        </div>
                                    </div>

                                    <p className="text-[var(--text-primary)] mb-4">{project.description}</p>

                                    {project.achievements && project.achievements.length > 0 && (
                                        <div className="mb-4">
                                            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                                                <Award className="w-4 h-4" />
                                                Achievements
                                            </h4>
                                            <ul className="space-y-1">
                                                {project.achievements.map((achievement, idx) => (
                                                    <li key={idx} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                                                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                                        <span>{achievement}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {project.technologies && project.technologies.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {project.technologies.map((tech) => (
                                                <span
                                                    key={tech}
                                                    className="px-3 py-1 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] rounded-full text-xs font-semibold"
                                                >
                                                    {tech}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="card p-12 text-center">
                                <FolderGit2 className="w-16 h-16 mx-auto mb-4 text-[var(--text-secondary)]" />
                                <p className="text-[var(--text-secondary)] mb-4">No projects added yet</p>
                                <button className="btn-primary flex items-center gap-2 mx-auto">
                                    <Plus className="w-4 h-4" />
                                    Add Project
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'education' && (
                    <motion.div
                        key="education"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-4"
                    >
                        {loadingEdu ? (
                            <div className="card p-8 text-center">
                                <p className="text-[var(--text-secondary)]">Loading education...</p>
                            </div>
                        ) : education?.results?.length > 0 ? (
                            education.results.map((edu: AgentEducation) => (
                                <div key={edu.id} className="card p-6 hover:shadow-lg transition-shadow">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">
                                                {edu.degree}
                                            </h3>
                                            <p className="text-[var(--accent-primary)] font-semibold mb-2">
                                                {edu.institution}
                                            </p>
                                            <p className="text-sm text-[var(--text-secondary)] mb-2">
                                                {edu.field_of_study}
                                            </p>
                                            <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>
                                                        {edu.start_date} - {edu.end_date}
                                                    </span>
                                                </div>
                                                {edu.gpa && (
                                                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-500 rounded-full text-xs font-semibold">
                                                        GPA: {edu.gpa}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors">
                                                <Edit2 className="w-4 h-4 text-[var(--text-secondary)]" />
                                            </button>
                                            <button
                                                onClick={() => deleteEduMutation.mutate(edu.id)}
                                                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </button>
                                        </div>
                                    </div>

                                    {edu.achievements && edu.achievements.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                                                <Award className="w-4 h-4" />
                                                Achievements
                                            </h4>
                                            <ul className="space-y-1">
                                                {edu.achievements.map((achievement, idx) => (
                                                    <li key={idx} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                                                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                                        <span>{achievement}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="card p-12 text-center">
                                <GraduationCap className="w-16 h-16 mx-auto mb-4 text-[var(--text-secondary)]" />
                                <p className="text-[var(--text-secondary)] mb-4">No education added yet</p>
                                <button className="btn-primary flex items-center gap-2 mx-auto">
                                    <Plus className="w-4 h-4" />
                                    Add Education
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
