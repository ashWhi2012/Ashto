import * as React from 'react';
import {View, Text, StyleSheet, Pressable, Image} from 'react-native';
import { useRouter, Stack } from 'expo-router';

export default function Workout() {
    return (
        <View>
            <Text style={styles.text}>
                Hello World
            </Text>
        </View>
    )
}

const styles = StyleSheet.create({
    text: {
        color: "darkviolet",

    }
})