import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAuth } from '../../hooks/useAuth';

const PROGRAMS = [
  { label: 'BBA', value: 'BBA' },
  { label: 'BBA-TT', value: 'BBA-TT' },
  { label: 'BCA', value: 'BCA' },
];

const SignupScreen = () => {
  const { signUp, isLoading, error } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [program, setProgram] = useState(PROGRAMS[0].value);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [cardAnimation] = useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.spring(cardAnimation, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleNext = () => {
    if (!fullName || !phone) {
      setFormError('Please fill in all required fields.');
      return;
    }
    setStep(2);
    setFormError('');
  };

  const handleSignup = async () => {
    setFormError('');
    setSuccessMessage('');

    if (!email || !username || !password || !confirmPassword) {
      setFormError('Please complete all account details.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    try {
      await signUp({
        full_name: fullName,
        email,
        username,
        phone_number: phone,
        password,
        program,
      });

      setSuccessMessage('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        router.replace('/(auth)/LoginScreen');
      }, 1500);
    } catch (err) {
      // handled via hook
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
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Title */}
          <Text style={styles.title}>Create Account</Text>

          {step === 1 && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={fullName}
                onChangeText={setFullName}
                placeholderTextColor="#9CA3AF"
              />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholderTextColor="#9CA3AF"
              />

              {(formError || error) && <Text style={styles.error}>{formError || error}</Text>}

              <TouchableOpacity
                onPress={handleNext}
                style={styles.button}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#EC4899']}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.buttonText}>Next</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          {step === 2 && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
              />
              <TextInput
                style={styles.input}
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#9CA3AF"
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholderTextColor="#9CA3AF"
              />
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Program:</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={program}
                    onValueChange={setProgram}
                    style={styles.picker}
                  >
                    {PROGRAMS.map((p) => (
                      <Picker.Item key={p.value} label={p.label} value={p.value} />
                    ))}
                  </Picker>
                </View>
              </View>

              {(formError || error) && <Text style={styles.error}>{formError || error}</Text>}
              {successMessage && <Text style={styles.success}>{successMessage}</Text>}

              <TouchableOpacity
                style={styles.button}
                onPress={handleSignup}
                disabled={isLoading || !!successMessage}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#EC4899']}
                  style={styles.buttonGradient}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Create Account</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setStep(1)}
                disabled={isLoading || !!successMessage}
                style={styles.linkButton}
              >
                <Text style={styles.link}>Back to Personal Info</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login Section */}
          <View style={styles.socialSection}>
            <Text style={styles.socialTitle}>Sign up with</Text>
            <View style={styles.socialIcons}>
              <TouchableOpacity style={styles.iconCircle}>
                <Icon name="google" size={24} color="#DB4437" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconCircle}>
                <Icon name="facebook" size={24} color="#4267B2" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconCircle}>
                <Icon name="linkedin" size={24} color="#0077B5" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Already have an account */}
          <TouchableOpacity
            onPress={() => router.push('/(auth)/LoginScreen')}
            style={styles.bottomLink}
          >
            <Text style={styles.link}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </LinearGradient>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    width: '90%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    marginVertical: 40,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 24,
    textAlign: 'center',
    color: '#6B21A8',
  },
  input: {
    width: '100%',
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: 'rgba(243, 244, 246, 0.7)',
    fontWeight: '500',
  },
  pickerContainer: {
    width: '100%',
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 16,
    marginBottom: 4,
    color: '#1F2937',
    fontWeight: '500',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 16,
    backgroundColor: 'rgba(243, 244, 246, 0.7)',
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 56,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  linkButton: {
    marginTop: 8,
  },
  link: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  error: {
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  success: {
    color: '#10B981',
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D1D5DB',
  },
  orText: {
    marginHorizontal: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  socialSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  socialTitle: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 12,
  },
  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  bottomLink: {
    marginTop: 20,
  },
}); 