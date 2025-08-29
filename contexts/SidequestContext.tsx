import React, { createContext, useContext, useEffect, useState } from 'react';
import { Sidequest, SidequestCategory, SidequestDifficulty, SidequestStatus } from '../types/sidequest';

interface SidequestContextType {
  sidequests: Sidequest[];
  addSidequest: (sidequest: Omit<Sidequest, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSidequest: (id: string, updates: Partial<Sidequest>) => void;
  deleteSidequest: (id: string) => void;
  getSidequestById: (id: string) => Sidequest | undefined;
  getSidequestsByStatus: (status: SidequestStatus) => Sidequest[];
  getSidequestsByCategory: (category: SidequestCategory) => Sidequest[];
}

const SidequestContext = createContext<SidequestContextType | undefined>(undefined);

export const useSidequests = () => {
  const context = useContext(SidequestContext);
  if (!context) {
    throw new Error('useSidequests must be used within a SidequestProvider');
  }
  return context;
};

export const SidequestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidequests, setSidequests] = useState<Sidequest[]>([]);

  // Initialize with sample data
  useEffect(() => {
    const sampleSidequests: Sidequest[] = [
      {
        id: '1',
        title: 'Learn to cook a new cuisine',
        description: 'Pick a cuisine you\'ve never cooked before and master 3 dishes from it',
        category: SidequestCategory.LEARNING,
        difficulty: SidequestDifficulty.MEDIUM,
        estimatedTime: '2 weeks',
        status: SidequestStatus.IN_PROGRESS,
        tags: ['cooking', 'culture', 'skill'],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        progress: 30,
        notes: 'Started with Thai cuisine. Made pad thai successfully!'
      },
      {
        id: '2',
        title: 'Write a short story',
        description: 'Write and complete a short story of at least 2000 words',
        category: SidequestCategory.CREATIVE,
        difficulty: SidequestDifficulty.MEDIUM,
        estimatedTime: '1 week',
        status: SidequestStatus.NOT_STARTED,
        tags: ['writing', 'creativity', 'storytelling'],
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
        progress: 0
      },
      {
        id: '3',
        title: 'Complete a 5K run',
        description: 'Train for and complete a 5K run without stopping',
        category: SidequestCategory.FITNESS,
        difficulty: SidequestDifficulty.EASY,
        estimatedTime: '1 month',
        status: SidequestStatus.COMPLETED,
        tags: ['running', 'fitness', 'endurance'],
        createdAt: new Date('2023-12-01'),
        updatedAt: new Date('2024-01-15'),
        completedAt: new Date('2024-01-15'),
        progress: 100,
        notes: 'Completed in 28 minutes! Felt amazing.'
      }
    ];
    setSidequests(sampleSidequests);
  }, []);

  const addSidequest = (sidequestData: Omit<Sidequest, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newSidequest: Sidequest = {
      ...sidequestData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setSidequests(prev => [...prev, newSidequest]);
  };

  const updateSidequest = (id: string, updates: Partial<Sidequest>) => {
    setSidequests(prev => prev.map(sidequest => 
      sidequest.id === id 
        ? { ...sidequest, ...updates, updatedAt: new Date() }
        : sidequest
    ));
  };

  const deleteSidequest = (id: string) => {
    setSidequests(prev => prev.filter(sidequest => sidequest.id !== id));
  };

  const getSidequestById = (id: string) => {
    return sidequests.find(sidequest => sidequest.id === id);
  };

  const getSidequestsByStatus = (status: SidequestStatus) => {
    return sidequests.filter(sidequest => sidequest.status === status);
  };

  const getSidequestsByCategory = (category: SidequestCategory) => {
    return sidequests.filter(sidequest => sidequest.category === category);
  };

  const value: SidequestContextType = {
    sidequests,
    addSidequest,
    updateSidequest,
    deleteSidequest,
    getSidequestById,
    getSidequestsByStatus,
    getSidequestsByCategory,
  };

  return (
    <SidequestContext.Provider value={value}>
      {children}
    </SidequestContext.Provider>
  );
}; 