import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { SpaceDetail } from '../../components/SpaceDetail';

export default function SpaceDetailPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const spaceId = params.id as string;

  const handleBack = () => {
    router.back();
  };

  return (
    <SpaceDetail 
      spaceId={spaceId} 
      onBack={handleBack}
    />
  );
}
