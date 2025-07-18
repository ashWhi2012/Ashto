import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';

//File is taking care of aesthetically organizing the screen and
//providing a way to navigate between screens.

export default function TabLayout() {
    return (
        <Tabs
        screenOptions={{
            tabBarActiveTintColor: '#ffd33d',
            headerStyle: {
                backgroundColor: '#25292e',
            },
            // headerTitleAlign: 'center',
            headerShadowVisible: false,
            headerTintColor: '#fff',
            tabBarStyle: {
                backgroundColor: '#25292e',
            },
        }}
        >

            <Tabs.Screen name='notes' options={{
                //unmountOnBlur: true,
                title: 'Notes',
                tabBarIcon: ({ color, focused }) => (
                    <FontAwesome name={focused ? 'home' :
                        'home'} color={color} size={24} />
                ),
            }}
            />

            <Tabs.Screen name='settings' options={{
                //unmountOnBlur: true,
                title: 'Settings',
                tabBarIcon: ({ color, focused }) => (
                    <FontAwesome name={focused ? 'gear' :
                        'gear'} color={color} size={24} />
                ),
            }}
            />

            <Tabs.Screen name='workoutTypes' options={{
                //unmountOnBlur: true,
                title: 'Workouts',
                tabBarIcon: ({ color, focused }) => (
                    <Ionicons name="barbell-outline" size={32} color={color}/>
                ),
            }}
            />

        </Tabs>
    )
}