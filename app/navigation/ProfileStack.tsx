import { createStackNavigator } from '@react-navigation/stack';
import ProfileScreen from '../components/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';


const Stack = createStackNavigator();

const ProfileStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: '#fafafa' }
    }}
  >
    <Stack.Screen name="ProfileMain" component={ProfileScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
  </Stack.Navigator>
);

export default ProfileStack;