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
  Animated
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

type TransactionType = 'income' | 'expense';
type Category = 'Food' | 'Transport' | 'Housing' | 'Entertainment' | 'Utilities' | 
                'Insurance' | 'Healthcare' | 'Education' | 'Shopping' | 'Savings' | 
                'Gifts' | 'Travel' | 'Personal Care' | 'Other';

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

const CATEGORIES = [
  { name: 'Food', icon: 'restaurant' },
  { name: 'Transport', icon: 'directions-bus' },
  { name: 'Housing', icon: 'home' },
  { name: 'Entertainment', icon: 'local-movies' },
  { name: 'Utilities', icon: 'plumbing' },
  { name: 'Insurance', icon: 'security' },
  { name: 'Healthcare', icon: 'local-hospital' },
  { name: 'Education', icon: 'school' },
  { name: 'Shopping', icon: 'shopping-cart' },
  { name: 'Savings', icon: 'savings' },
  { name: 'Gifts', icon: 'card-giftcard' },
  { name: 'Travel', icon: 'flight' },
  { name: 'Personal Care', icon: 'spa' },
  { name: 'Other', icon: 'category' }
];

const TRANSACTION_TYPES: TransactionType[] = ['income', 'expense'];

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  visible,
  formState,
  setFormState,
  onSubmit,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const progressAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (!visible) {
      setCurrentStep(1);
      setFormState(prev => ({
        ...prev,
        date: new Date()
      }));
    }
  }, [visible]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentStep,
      duration: 300,
      useNativeDriver: false
    }).start();
  }, [currentStep]);

  const handleNext = () => {
    switch(currentStep) {
      case 1:
        if (!formState.amount || isNaN(Number(formState.amount)) || Number(formState.amount) <= 0) {
          Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0');
          return;
        }
        break;
      case 2:
        if (!formState.type) {
          Alert.alert('Select Type', 'Please select income or expense');
          return;
        }
        break;
      case 3:
        if (!formState.category) {
          Alert.alert('Select Category', 'Please select a category');
          return;
        }
        break;
    }
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setFormState(prev => ({
        ...prev,
        date: selectedDate
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const amount = Number(formState.amount);
      
      await onSubmit({
        ...formState,
        amount: amount,
      });

      setFormState({
        title: '',
        amount: '',
        type: 'income',
        category: 'Food',
        date: new Date()
      });
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to add transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderProgressIndicator = () => {
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.progressBar}
      >
        {[1, 2, 3, 4, 5, 6].map(step => (
          <View key={step} style={styles.progressStepContainer}>
            <Animated.View 
              style={[
                styles.progressDot,
                currentStep >= step && styles.activeProgressDot,
                {
                  transform: [{
                    scale: progressAnim.interpolate({
                      inputRange: [step - 0.5, step],
                      outputRange: [1, 1.2],
                      extrapolate: 'clamp'
                    })
                  }]
                }
              ]}
            >
              <Text style={[
                styles.progressText,
                currentStep >= step && styles.activeProgressText
              ]}>
                {step}
              </Text>
            </Animated.View>
            {step < 6 && (
              <View style={[
                styles.progressLine,
                currentStep > step && styles.activeProgressLine
              ]} />
            )}
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderStep = () => {
    switch(currentStep) {
      case 1: return (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>How much?</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="$0.00"
            placeholderTextColor="#999"
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
          <Text style={styles.stepTitle}>Type of Transaction</Text>
          <View style={styles.typeContainer}>
            {TRANSACTION_TYPES.map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  formState.type === type && { 
                    backgroundColor: type === 'income' ? '#2ecc71' : '#e74c3c',
                    borderColor: type === 'income' ? '#2ecc71' : '#e74c3c'
                  }
                ]}
                onPress={() => setFormState(prev => ({ ...prev, type }))}
              >
                <MaterialIcons 
                  name={type === 'income' ? 'arrow-upward' : 'arrow-downward'} 
                  size={28} 
                  color={formState.type === type ? 'white' : '#666'} 
                />
                <Text style={[
                  styles.typeButtonText,
                  formState.type === type && { color: 'white' }
                ]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
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
          <Text style={styles.stepTitle}>Select Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map(({ name, icon }) => (
              <TouchableOpacity
                key={name}
                style={[
                  styles.categoryButton,
                  formState.category === name && styles.selectedCategory
                ]}
                onPress={() => setFormState(prev => ({ ...prev, category: name }))}
              >
                <MaterialIcons 
                  name={icon as any} 
                  size={24} 
                  color={formState.category === name ? 'white' : '#666'} 
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
          <Text style={styles.stepTitle}>Add Note (Optional)</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Enter a note (optional)..."
            placeholderTextColor="#999"
            value={formState.title}
            onChangeText={text => setFormState(prev => ({ ...prev, title: text }))}
            multiline
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
          <Text style={styles.stepTitle}>Select Date & Time</Text>
          <DateTimePicker
            value={formState.date}
            mode="datetime"
            display="spinner"
            onChange={handleDateChange}
            style={styles.datePicker}
          />
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
          <Text style={styles.stepTitle}>Review Transaction</Text>
          <View style={styles.reviewContainer}>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Amount:</Text>
              <Text style={styles.reviewValue}>${Number(formState.amount).toFixed(2)}</Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Type:</Text>
              <Text style={[
                styles.reviewValue,
                { color: formState.type === 'income' ? '#2ecc71' : '#e74c3c' }
              ]}>
                {formState.type.charAt(0).toUpperCase() + formState.type.slice(1)}
              </Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Category:</Text>
              <Text style={styles.reviewValue}>{formState.category}</Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Note:</Text>
              <Text style={styles.reviewValue}>{formState.title || 'No note added'}</Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Date & Time:</Text>
              <Text style={styles.reviewValue}>
                {formState.date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
                {' '}
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
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
            {renderProgressIndicator()}
          </View>
          
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
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
    backgroundColor: '#fff',
  },
  modalContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 8,
  },
  closeButton: {
    padding: 8,
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  },
  progressStepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  activeProgressDot: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  progressText: {
    color: '#999',
    fontWeight: '600',
    fontSize: 14,
  },
  activeProgressText: {
    color: 'white',
  },
  progressLine: {
    width: 20,
    height: 2,
    backgroundColor: '#ddd',
    marginHorizontal: 2,
  },
  activeProgressLine: {
    backgroundColor: '#3498db',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 40,
    textAlign: 'center',
  },
  amountInput: {
    fontSize: 40,
    fontWeight: '300',
    color: '#2c3e50',
    textAlign: 'center',
    padding: 16,
    marginBottom: 24,
  },
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 40,
  },
  typeButton: {
    width: 120,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    gap: 10,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 40,
  },
  categoryButton: {
    width: '30%',
    minWidth: 90,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    gap: 8,
    margin: 4,
  },
  selectedCategory: {
    backgroundColor: '#3498db',
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedCategoryText: {
    color: 'white',
  },
  noteInput: {
    fontSize: 18,
    color: '#2c3e50',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    marginBottom: 40,
    textAlignVertical: 'top',
  },
  datePicker: {
    width: '100%',
    marginBottom: 24,
  },
  reviewContainer: {
    gap: 12,
    marginBottom: 24,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  reviewLabel: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  reviewValue: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  stepActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
  },
  backButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  nextButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#3498db',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#2ecc71',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  submitDisabled: {
    backgroundColor: '#95a5a6',
    opacity: 0.7,
  },
});

export default AddTransactionModal;