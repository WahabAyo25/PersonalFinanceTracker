// AddTransactionModal.tsx (Enhanced Progress Indicator)
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

// Import useSettings and Currency type from SettingsContext
import { useSettings } from '../context/SettingsContext'; // Adjust path if SettingsContext.tsx is elsewhere
import type { Currency as AppCurrency } from '../context/SettingsContext'; // Use 'type' import for type-only imports

// ---- Get screen dimensions ----
const { height, width } = Dimensions.get('window');

type TransactionType = 'income' | 'expense';

// Student-focused category types
type IncomeCategoryName =
  | 'Part-time Job'
  | 'Allowance'
  | 'Scholarship'
  | 'Tutoring'
  | 'Selling Stuff'
  | 'Gifts Received'
  | 'Side Hustle'
  | 'Other Income';

type ExpenseCategoryName =
  | 'Food & Snacks'
  | 'Books & Supplies'
  | 'Transport'
  | 'Entertainment'
  | 'Social Outings'
  | 'Subscriptions'
  | 'Rent/Dorm'
  | 'Phone/Internet'
  | 'Clothing'
  | 'Personal Care'
  | 'Study Tools'
  | 'Fees (Uni/College)'
  | 'Savings Contribution'
  | 'Other Expense';

type Category = IncomeCategoryName | ExpenseCategoryName;

interface CategoryItem {
  name: Category;
  icon: keyof typeof MaterialIcons.glyphMap;
}

interface FormState {
  title: string;
  amount: string;
  type: TransactionType;
  category: Category;
  date: Date;
}

interface AddTransactionModalProps {
  visible: boolean;
  formState: FormState;
  setFormState: React.Dispatch<React.SetStateAction<FormState>>;
  onSubmit: (transaction: Omit<FormState, 'amount'> & { amount: number }) => void;
  onClose: () => void;
}

const INCOME_CATEGORIES_STUDENT: CategoryItem[] = [
  { name: 'Part-time Job', icon: 'work-outline' },
  { name: 'Allowance', icon: 'account-balance-wallet' },
  { name: 'Scholarship', icon: 'school' },
  { name: 'Tutoring', icon: 'history-edu' },
  { name: 'Selling Stuff', icon: 'sell' },
  { name: 'Gifts Received', icon: 'redeem' },
  { name: 'Side Hustle', icon: 'lightbulb-outline' },
  { name: 'Other Income', icon: 'category' },
];

const EXPENSE_CATEGORIES_STUDENT: CategoryItem[] = [
  { name: 'Food & Snacks', icon: 'fastfood' },
  { name: 'Books & Supplies', icon: 'menu-book' },
  { name: 'Transport', icon: 'directions-bus' },
  { name: 'Entertainment', icon: 'videogame-asset' },
  { name: 'Social Outings', icon: 'people-outline' },
  { name: 'Subscriptions', icon: 'subscriptions' },
  { name: 'Rent/Dorm', icon: 'night-shelter' },
  { name: 'Phone/Internet', icon: 'wifi' },
  { name: 'Clothing', icon: 'checkroom' },
  { name: 'Personal Care', icon: 'spa' },
  { name: 'Study Tools', icon: 'laptop-mac' },
  { name: 'Fees (Uni/College)', icon: 'local-library' },
  { name: 'Savings Contribution', icon: 'savings' },
  { name: 'Other Expense', icon: 'category' },
];

const TRANSACTION_TYPES: TransactionType[] = ['income', 'expense'];

const initialFormStateStudent: FormState = {
  title: '',
  amount: '',
  type: 'expense',
  category: EXPENSE_CATEGORIES_STUDENT[0].name,
  date: new Date(),
};

// Enhanced step configuration
const STEPS = [
  {
    number: 1,
    title: 'Amount',
    icon: 'attach-money',
    shortTitle: 'Amount'
  },
  {
    number: 2,
    title: 'Type',
    icon: 'swap-vert',
    shortTitle: 'Type'
  },
  {
    number: 3,
    title: 'Category',
    icon: 'category',
    shortTitle: 'Category'
  },
  {
    number: 4,
    title: 'Note',
    icon: 'edit-note',
    shortTitle: 'Note'
  },
  {
    number: 5,
    title: 'Date',
    icon: 'event',
    shortTitle: 'Date'
  },
  {
    number: 6,
    title: 'Review',
    icon: 'check-circle',
    shortTitle: 'Review'
  },
];

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  visible,
  formState,
  setFormState,
  onSubmit,
  onClose,
}) => {
  const { settings } = useSettings(); // Get settings from context
  const appCurrency = settings.currency; // Get the currency from settings

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const progressAnim = useState(new Animated.Value(0))[0];
  const [showDatePicker, setShowDatePicker] = useState(Platform.OS === 'ios');
  const [stepAnimations] = useState(() =>
    STEPS.map(() => new Animated.Value(0))
  );

  // Helper function to get currency symbol
  const getCurrencySymbol = (currencyCode: AppCurrency): string => {
    switch (currencyCode) {
      case 'GBP':
        return '£';
      case 'NGN':
        return '₦';
      case 'USD':
        return '$';
      default:
        // Fallback for any unhandled currency codes
        return '$'; 
    }
  };
  
  const currencySymbol = getCurrencySymbol(appCurrency);

  useEffect(() => {
    if (!visible) {
      setCurrentStep(1);
      setFormState(initialFormStateStudent);
      progressAnim.setValue(0);
      stepAnimations.forEach(anim => anim.setValue(0));
    } else {
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false
      }).start();
    }
  }, [visible, setFormState, progressAnim, stepAnimations]);

  useEffect(() => {
    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: currentStep,
      duration: 400,
      useNativeDriver: false
    }).start();

    // Animate individual steps
    stepAnimations.forEach((anim, index) => {
      const stepNumber = index + 1;
      Animated.timing(anim, {
        toValue: currentStep >= stepNumber ? 1 : 0,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true
      }).start();
    });
  }, [currentStep, progressAnim, stepAnimations]);

  const handleNext = () => {
    switch(currentStep) {
      case 1:
        if (!formState.amount || isNaN(Number(formState.amount)) || Number(formState.amount) <= 0) {
          Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0.');
          return;
        }
        break;
      case 2:
        if (!formState.type) {
          Alert.alert('Select Type', 'Is this money in or out?');
          return;
        }
        const currentCategoriesList = formState.type === 'income' ? INCOME_CATEGORIES_STUDENT : EXPENSE_CATEGORIES_STUDENT;
        if (!formState.category || !currentCategoriesList.find(cat => cat.name === formState.category)) {
            setFormState(prev => ({ ...prev, category: currentCategoriesList[0].name }));
        }
        break;
      case 3:
        if (!formState.category) {
          Alert.alert('Select Category', 'What kind of transaction is this?');
          return;
        }
        break;
    }
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleTypeChange = (newType: TransactionType) => {
    setFormState(prev => ({
      ...prev,
      type: newType,
      category: newType === 'income' ? INCOME_CATEGORIES_STUDENT[0].name : EXPENSE_CATEGORIES_STUDENT[0].name,
    }));
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
        setShowDatePicker(false);
    }
    if (event.type === "set" && selectedDate) {
      setFormState(prev => ({
        ...prev,
        date: selectedDate
      }));
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!formState.amount || isNaN(Number(formState.amount)) || Number(formState.amount) <= 0) {
        Alert.alert('Invalid Amount', 'Please check the amount.');
        setCurrentStep(1);
        return;
    }
    if (!formState.type) {
        Alert.alert('Missing Type', 'Please select if this is income or an expense.');
        setCurrentStep(2);
        return;
    }
    if (!formState.category) {
        Alert.alert('Missing Category', 'Please select a category.');
        setCurrentStep(3);
        return;
    }
    
    try {
      setIsSubmitting(true);
      const amount = Number(formState.amount);
      
      await onSubmit({
        ...formState,
        amount: amount,
      });
      onClose();
    } catch (error) {
      console.error("Submission error:", error);
      Alert.alert('Error', 'Oops! Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderProgressIndicator = () => {
    return (
      <View style={styles.progressContainer}>
        {/* Progress Bar Background */}
        <View style={styles.progressBarBackground}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [1, STEPS.length],
                  outputRange: ['16.67%', '100%'],
                  extrapolate: 'clamp'
                })
              }
            ]}
          />
        </View>
        
        {/* Step Indicators */}
        <View style={styles.stepsContainer}>
          {STEPS.map((step, index) => {
            const isActive = currentStep >= step.number;
            const isCurrent = currentStep === step.number;
            
            return (
              <Animated.View
                key={step.number}
                style={[
                  styles.stepIndicator,
                  {
                    transform: [{
                      scale: stepAnimations[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      })
                    }]
                  }
                ]}
              >
                <Animated.View
                  style={[
                    styles.stepCircle,
                    isActive && styles.activeStepCircle,
                    isCurrent && styles.currentStepCircle,
                    {
                      backgroundColor: stepAnimations[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: ['#e0e0e0', isActive ? '#3498db' : '#e0e0e0'],
                      }),
                      borderColor: stepAnimations[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: ['#c7c7c7', isActive ? '#2980b9' : '#c7c7c7'],
                      })
                    }
                  ]}
                >
                  {isActive ? (
                    <MaterialIcons
                      name={step.number < currentStep ? 'check' : step.icon}
                      size={16}
                      color="white"
                    />
                  ) : (
                    <Text style={styles.stepNumber}>{step.number}</Text>
                  )}
                </Animated.View>
                
                <Text style={[
                  styles.stepLabel,
                  isActive && styles.activeStepLabel,
                  isCurrent && styles.currentStepLabel
                ]}>
                  {step.shortTitle}
                </Text>
              </Animated.View>
            );
          })}
        </View>
        
        {/* Current Step Info */}
        <View style={styles.currentStepInfo}>
          <Text style={styles.currentStepText}>
            Step {currentStep} of {STEPS.length}
          </Text>
          <Text style={styles.currentStepTitle}>
            {STEPS[currentStep - 1]?.title}
          </Text>
        </View>
      </View>
    );
  };

  const renderStep = () => {
    const currentCategories = formState.type === 'income' ? INCOME_CATEGORIES_STUDENT : EXPENSE_CATEGORIES_STUDENT;

    switch(currentStep) {
      case 1: return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>How much?</Text>
          <TextInput
            style={styles.amountInput}
            placeholder={`${currencySymbol}0.00`} // Display currency symbol
            placeholderTextColor="#aaa"
            keyboardType="numeric"
            value={formState.amount}
            onChangeText={text => setFormState(prev => ({ ...prev, amount: text }))}
            autoFocus
            selectionColor="#3498db"
          />
          <View style={styles.stepActions}>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Next →</Text>
            </TouchableOpacity>
          </View>
        </View>
      );

      case 2: return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Money In or Out?</Text>
          <View style={styles.typeContainer}>
            {TRANSACTION_TYPES.map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  formState.type === type && {
                    backgroundColor: type === 'income' ? '#2ecc71' : '#e74c3c',
                    borderColor: type === 'income' ? '#27ae60' : '#c0392b'
                  }
                ]}
                onPress={() => handleTypeChange(type)}
              >
                <MaterialIcons
                  name={type === 'income' ? 'arrow-upward' : 'arrow-downward'}
                  size={28}
                  color={formState.type === type ? 'white' : '#555'}
                />
                <Text style={[
                  styles.typeButtonText,
                  formState.type === type && { color: 'white' }
                ]}>
                  {type === 'income' ? "Money In" : "Money Out"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.stepActions}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Next →</Text>
            </TouchableOpacity>
          </View>
        </View>
      );

      case 3: return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>What's it for?</Text>
          <ScrollView contentContainerStyle={styles.categoryGridScrollView}>
            <View style={styles.categoryGrid}>
              {currentCategories.map(({ name, icon }) => (
                <TouchableOpacity
                  key={name}
                  style={[
                    styles.categoryButton,
                    formState.category === name && styles.selectedCategory
                  ]}
                  onPress={() => setFormState(prev => ({ ...prev, category: name }))}
                >
                  <MaterialIcons
                    name={icon}
                    size={24}
                    color={formState.category === name ? 'white' : (formState.type === 'income' ? '#27ae60' : '#c0392b')}
                  />
                  <Text style={[
                    styles.categoryText,
                    formState.category === name && styles.selectedCategoryText
                  ]}>
                    {name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <View style={styles.stepActions}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Next →</Text>
            </TouchableOpacity>
          </View>
        </View>
      );

      case 4: return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Add a Note (Optional)</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="E.g., Lunch with friends, New textbook..."
            placeholderTextColor="#aaa"
            value={formState.title}
            onChangeText={text => setFormState(prev => ({ ...prev, title: text }))}
            multiline
            numberOfLines={3}
            autoFocus
            selectionColor="#3498db"
          />
          <View style={styles.stepActions}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Next →</Text>
            </TouchableOpacity>
          </View>
        </View>
      );

      case 5: return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>When did this happen?</Text>
          {Platform.OS === 'android' && (
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButtonAndroid}>
                <Text style={styles.datePickerButtonTextAndroid}>
                    {formState.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    {' at '}
                    {formState.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit'})}
                </Text>
                <MaterialIcons name="edit-calendar" size={20} color="#3498db" />
            </TouchableOpacity>
          )}
          {showDatePicker && (
            <DateTimePicker
                value={formState.date}
                mode="datetime"
                display={Platform.OS === 'ios' ? "spinner" : "default"}
                onChange={handleDateChange}
                style={styles.datePicker}
                maximumDate={new Date()}
            />
          )}
          <View style={styles.stepActions}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>Review →</Text>
            </TouchableOpacity>
          </View>
        </View>
      );

      case 6: return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>All Set?</Text>
          <View style={styles.reviewContainer}>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Amount:</Text>
              <Text style={[styles.reviewValue, { color: formState.type === 'income' ? '#2ecc71' : '#e74c3c', fontWeight: 'bold' }]}>
                {formState.type === 'income' ? '+' : '-'} {currencySymbol}{Number(formState.amount).toFixed(2)} {/* Display currency symbol */}
              </Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Type:</Text>
              <Text style={[
                styles.reviewValue,
                { color: formState.type === 'income' ? '#2ecc71' : '#e74c3c' }
              ]}>
                {formState.type === 'income' ? "Money In" : "Money Out"}
              </Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Category:</Text>
              <Text style={styles.reviewValue}>{formState.category}</Text>
            </View>
            {formState.title.trim() !== '' && (
                <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Note:</Text>
                <Text style={styles.reviewValue} numberOfLines={2}>{formState.title}</Text>
                </View>
            )}
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Date & Time:</Text>
              <Text style={styles.reviewValue}>
                {formState.date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
                {' at '}
                {formState.date.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
          </View>
          <View style={styles.stepActions}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Saving...' : 'Save Transaction'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );

      default: return null;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={28} color="#555" />
            </TouchableOpacity>
            {renderProgressIndicator()}
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {renderStep()}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f9fc',
  },
  modalContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 0,
  },
  header: {
    marginBottom: 20,
    paddingTop: 10,
  },
  closeButton: {
    padding: 8,
    position: 'absolute',
    right: 0,
    top: 10,
    zIndex: 1,
  },
  
  // Enhanced Progress Indicator Styles
  progressContainer: {
    paddingHorizontal: 40,
    paddingVertical: 16,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginBottom: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 2,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepIndicator: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    borderWidth: 2,
    borderColor: '#c7c7c7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  activeStepCircle: {
    backgroundColor: '#3498db',
    borderColor: '#2980b9',
  },
  currentStepCircle: {
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  stepNumber: {
    color: '#777',
    fontWeight: 'bold',
    fontSize: 12,
  },
  stepLabel: {
    fontSize: 10,
    color: '#777',
    fontWeight: '500',
    textAlign: 'center',
  },
  activeStepLabel: {
    color: '#3498db',
    fontWeight: '600',
  },
  currentStepLabel: {
    color: '#2980b9',
    fontWeight: 'bold',
  },
  currentStepInfo: {
    alignItems: 'center',
    marginTop: 8,
  },
  currentStepText: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  currentStepTitle: {
    fontSize: 16,
    color: '#34495e',
    fontWeight: '600',
    marginTop: 2,
  },

  // Rest of the existing styles
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    minHeight: Platform.OS === 'web' ? 500 : undefined, // Adjust as needed for web
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 25,
    textAlign: 'center',
    marginTop: 10,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: '300',
    color: '#2c3e50',
    textAlign: 'center',
    paddingVertical: 16,
    marginVertical: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#ecf0f1',
  },
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
    marginVertical: 20,
  },
  typeButton: {
    flex: 1,
    maxWidth: 150,
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#bdc3c7',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#fff',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#34495e',
  },
  categoryGridScrollView: {
    paddingBottom: 10,
    maxHeight: Platform.OS === 'web' ? 300 : height * 0.4, // Adjust as needed
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginVertical: 10,
  },
  categoryButton: {
    width: '30%',
    aspectRatio: 1.1,
    minWidth: 85,
    maxWidth: 100,
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#ecf0f1',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
    elevation: 1,
  },
  selectedCategory: {
    backgroundColor: '#3498db',
    borderColor: '#2980b9',
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 2,
  },
  selectedCategoryText: {
    color: 'white',
  },
  noteInput: {
    fontSize: 17,
    color: '#34495e',
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 12,
    padding: 16,
    minHeight: 80,
    marginVertical: 20,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
  },
  datePickerButtonAndroid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dfe6e9',
    marginVertical: 20,
  },
  datePickerButtonTextAndroid: {
    fontSize: 16,
    color: '#34495e',
  },
  datePicker: {
    width: '100%',
    marginVertical: 20,
    height: Platform.OS === 'ios' ? 200 : undefined,
  },
  reviewContainer: {
    gap: 10,
    marginVertical: 15,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ecf0f1'
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  reviewLabel: {
    fontSize: 15,
    color: '#7f8c8d',
    flex: 1,
  },
  reviewValue: {
    fontSize: 15,
    color: '#34495e',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  stepActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  backButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#ecf0f1',
  },
  backButtonText: {
    color: '#7f8c8d',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#3498db',
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#2ecc71',
    shadowColor: '#2ecc71',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  submitDisabled: {
    backgroundColor: '#bdc3c7',
    opacity: 0.8,
    shadowColor: '#bdc3c7',
  },
});

export default AddTransactionModal;