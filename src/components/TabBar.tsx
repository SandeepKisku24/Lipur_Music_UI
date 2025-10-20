// Lipur_ui/src/components/TabBar.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons'; 

// Type assertion for the icon component (to bypass TypeScript errors)
const VectorIcon = Icon as unknown as React.ComponentClass<any, any>; 

interface TabBarProps {
  activeTab: string;
  setTab: (tab: string) => void;
}

const TabBar: React.FC<TabBarProps> = ({ activeTab, setTab }) => {
  const tabs = [
    { name: 'Home', icon: 'home' },
    { name: 'Search', icon: 'search' },
    { name: 'Library', icon: 'my-library-music' },
    { name: 'Profile', icon: 'person' },
  ];

  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.name;
        const color = isActive ? 'white' : '#B3B3B3';
        
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabButton}
            onPress={() => setTab(tab.name)}
          >
            <VectorIcon name={tab.icon} size={24} color={color} />
            <Text style={[styles.tabText, { color }]}>{tab.name}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    height: 65, // Standard TabBar height
    backgroundColor: '#282828', // Dark background
    borderTopWidth: 0,
    paddingBottom: 5,
    zIndex: 10, // Ensure it is above everything else
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 5,
  },
  tabText: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: 'bold',
  },
});

export default TabBar;