// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { MedicationDatabase } from '@api/entities';
// removed unused Input, Button, Alert components
// removed unused lucide icons
// import DemoDisclaimer from "../components/common/DemoDisclaimer"; // removed, shown from Layout


export default function DatabasePage() {
  const [medications, setMedications] = useState([]);
  const [filteredMedications, setFilteredMedications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const filterMedications = useCallback(() => {
    let filtered = medications;

    if (searchQuery) {
      filtered = filtered.filter(
        (med) =>
          med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          med.generic_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          med.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((med) => med.category === selectedCategory);
    }

    if (selectedRiskLevel !== 'all') {
      filtered = filtered.filter((med) => med.risk_level === selectedRiskLevel);
    }

    setFilteredMedications(filtered);
  }, [medications, searchQuery, selectedCategory, selectedRiskLevel]);

  useEffect(() => {
    loadMedications();
  }, []);

  useEffect(() => {
    filterMedications();
  }, [filterMedications]);

  const loadMedications = async () => {
    setIsLoading(true);
    try {
      const data = await MedicationDatabase.list('name');
      setMedications(data);
    } catch (error) {
      console.error('Error loading medication database:', error);
    }
    setIsLoading(false);
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-neutral-warm via-white to-stone-50 p-4 md:p-8'>
      <div className='max-w-7xl mx-auto'>
        <div className='mb-8'>
          <h1 className='text-3xl md:text-4xl font-bold text-text-primary mb-2'>
            Medication Database
          </h1>
          <p className='text-text-secondary text-lg'>
            Explore altitude effects of common medications
          </p>
        </div>

        {/* Removed inline disclaimer; Layout handles it conditionally */}

        <DatabaseSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        <DatabaseFilters
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedRiskLevel={selectedRiskLevel}
          setSelectedRiskLevel={setSelectedRiskLevel}
        />

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {isLoading ? (
            Array(6)
              .fill(0)
              .map((_, i) => <div key={i} className='h-64 bg-white rounded-xl animate-pulse' />)
          ) : filteredMedications.length === 0 ? (
            <div className='col-span-full text-center py-12'>
              <Search className='w-16 h-16 text-secondary-blue mx-auto mb-4 opacity-50' />
              <h3 className='text-xl font-semibold text-text-primary mb-2'>No medications found</h3>
              <p className='text-text-secondary'>Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredMedications.map((medication) => (
              <MedicationCard key={medication.id} medication={medication} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
