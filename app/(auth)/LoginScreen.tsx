import { AntDesign, Entypo, FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';

const { width } = Dimensions.get('window');

const LoginScreen = () => {
  const { signIn, isLoading, error } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [cardAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.spring(cardAnimation, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleLogin = async () => {
    setFormError('');
    setSuccessMessage('');
    if (!identifier || !password) {
      setFormError('Please enter your email/username and password.');
      return;
    }
    try {
      await signIn(identifier, password);
      setSuccessMessage('Login successful! Redirecting...');
      setTimeout(() => {
        router.replace('/DashboardScreen');
      }, 1000);
    } catch (err) {
      // error handled in hook
    }
  };

  return (
    <LinearGradient
      colors={['#6B21A8', '#A855F7', '#DBEAFE']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Animated.View
        style={[
          styles.card,
          {
            transform: [
              { scale: cardAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) },
              { translateY: cardAnimation.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) },
            ],
          },
        ]}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoWrapper}>
            <Image
              source={require('../../assets/images/note.png')}
              style={styles.logo}
              contentFit="contain"
              transition={1000}
            />
          </View>
          <Text style={styles.appName}>NoteBazaar</Text>
          <Text style={styles.tagline}>Your Digital Note Marketplace</Text>
        </View>

        <Text style={styles.title}>Welcome Back</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Username or Email"
            autoCapitalize="none"
            value={identifier}
            onChangeText={setIdentifier}
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {(formError || error) && <Text style={styles.error}>{formError || error}</Text>}
        {successMessage && <Text style={styles.success}>{successMessage}</Text>}

        <View style={styles.row}>
          <Text style={styles.remember}>Remember me</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/ForgotPassword')}>
            <Text style={styles.forgot}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#8B5CF6', '#EC4899']}
            style={styles.loginButtonGradient}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginText}>Sign In</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.orText}>Or continue with</Text>

        <View style={styles.socialIcons}>
          <TouchableOpacity style={styles.iconCircle}>
            <AntDesign name="google" size={24} color="#DB4437" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconCircle}>
            <Entypo name="linkedin" size={24} color="#0A66C2" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconCircle}>
            <FontAwesome name="facebook" size={24} color="#1877F2" />
          </TouchableOpacity>
        </View>

        <View style={styles.signUpRow}>
          <Text style={styles.newUserText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/SignupScreen')}>
            <Text style={styles.signUpText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    marginHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 32,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoWrapper: {
    width: width * 0.25,
    height: width * 0.25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#6B21A8',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 32,
    color: '#1F2937',
    opacity: 0.9,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(243, 244, 246, 0.7)',
    fontSize: 16,
    fontWeight: '500',
  },
  error: {
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  remember: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  forgot: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  loginButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  loginButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  orText: {
    color: '#6B7280',
    marginBottom: 20,
    fontSize: 14,
    fontWeight: '500',
  },
  socialIcons: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  signUpRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newUserText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  signUpText: {
    marginLeft: 6,
    color: '#8B5CF6',
    fontWeight: '600',
    fontSize: 14,
  },
  success: {
    color: '#10B981',
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default LoginScreen; 