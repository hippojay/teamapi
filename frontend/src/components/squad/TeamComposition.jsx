import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import CompactTeamCompositionBar from '../CompactTeamCompositionBar';

const TeamComposition = ({ squad }) => {
  const { darkMode } = useTheme();

  return (
    <div className={`${darkMode ? 'bg-dark-card border-dark-border' : 'bg-white border-gray-200'} p-6 rounded-lg shadow-sm border`}>
      <h3 className={`text-lg font-semibold ${darkMode ? 'text-dark-primary' : 'text-gray-800'} mb-4`}>Team Composition</h3>
      <CompactTeamCompositionBar
        core_count={squad.core_count}
        subcon_count={squad.subcon_count}
        core_capacity={squad.core_capacity}
        subcon_capacity={squad.subcon_capacity}
      />
    </div>
  );
};

export default TeamComposition;
