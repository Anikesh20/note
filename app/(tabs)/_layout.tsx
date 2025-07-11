import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useTheme } from 'react-native-paper';

export default function TabLayout() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.outline,
        tabBarStyle: {
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          height: 64,
          paddingBottom: 8,
          backgroundColor: theme.colors.background,
        },
        tabBarLabelStyle: { fontWeight: 'bold', fontSize: 13 },
        tabBarIcon: ({ color, size }) => {
          let iconName = 'home';
          if (route.name === 'index') iconName = 'view-dashboard';
          else if (route.name === 'ExploreScreen') iconName = 'compass';
          else if (route.name === 'MyNotesScreen') iconName = 'notebook';
          else if (route.name === 'ProfileScreen') iconName = 'account-circle';
          else if (route.name === 'UploadScreen') iconName = 'upload';
          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
      })}
    />
  );
} 