// Lipur_ui/src/components/TabBar.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { IconButton } from 'react-native-paper';

interface TabBarProps {
  activeTab: string;
  setTab: (tab: string) => void;
}

const TabBar: React.FC<TabBarProps> = ({ activeTab, setTab }) => {
  const tabs = [
    { name: 'Home', icon: 'home' },
    { name: 'Search', icon: 'magnify' },
    { name: 'Library', icon: 'book' },
    { name: 'Profile', icon: 'account-circle' },
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
            <IconButton icon={tab.icon} size={28} iconColor={color} />
            {/* <Text style={[styles.tabText, { color }]}>{tab.name}</Text> */}
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
    height: 60,
    backgroundColor: '#282828',
    paddingBottom: 5,
    paddingTop: 5,
    zIndex: 10,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 2,
    marginBottom: 2,
  },
  tabText: {
    fontSize: 10,
    fontWeight: 'bold',
    paddingBottom: 10,
  },
});

export default TabBar;
