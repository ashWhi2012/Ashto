import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';

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

            <Tabs.Screen name='index' options={{
                //unmountOnBlur: true,
                title: 'Home',
                tabBarIcon: ({ color, focused }) => (
                    <FontAwesome name={focused ? 'home' :
                        'home'} color={color} size={24} />
                ),
            }}
            />

            <Tabs.Screen name='profile' options={{
                //unmountOnBlur: true,
                title: 'Profile',
                tabBarIcon: ({ color, focused }) => (
                    <FontAwesome name={focused ? 'user' :
                        'user'} color={color} size={24} />
                ),
            }}
            />

            <Tabs.Screen name='events' options={{
                //unmountOnBlur: true,
                title: 'Events',
                tabBarIcon: ({ color, focused }) => (
                    <MaterialIcons name={focused ? 'event' :
                        'event'} color={color} size={24} />
                ),
            }}
            />

            <Tabs.Screen name='memberPosts' 
                options={{
                //unmountOnBlur: true,
                title: "Member Posts",
                tabBarIcon: ({color,focused}) => 
                    // {
                    // return ( //This shows how to do a custom icon
                    //   <Image
                    //     style={{ width: 30, height: 30}}
                    //     source={
                    //         require('@/assets/images/serve.png')
                    //     }
                    //     tintColor={color}
                    //   />
                    // )
                    // }}}
                    <MaterialIcons
                        name={focused ? 'post-add' :
                        'post-add'} color={color} size={24}
                    />
                }}
            />

        </Tabs>
    )
}