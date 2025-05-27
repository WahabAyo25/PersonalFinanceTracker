import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { MaterialIcons } from '@expo/vector-icons';

type CurrencyCode = 'GBP' | 'NGN' | 'USD' | 'EUR';

type CurrencyOption = {
  code: CurrencyCode;
  symbol: string;
  name: string;
  country?: string;
};

const currencyOptions: CurrencyOption[] = [
  { code: 'GBP', symbol: '£', name: 'British Pound', country: 'United Kingdom' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', country: 'Nigeria' },
  { code: 'USD', symbol: '$', name: 'US Dollar', country: 'United States' },
  { code: 'EUR', symbol: '€', name: 'Euro', country: 'European Union' },
];

interface SettingItemProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightComponent?: React.ReactNode;
  disabled?: boolean;
  testID?: string;
}

const SettingItem: React.FC<SettingItemProps> = ({
  title,
  subtitle,
  onPress,
  rightComponent,
  disabled = false,
  testID,
}) => {
  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={[styles.settingItem, disabled && styles.disabledItem]}
      onPress={disabled ? undefined : onPress}
      activeOpacity={onPress ? 0.7 : 1}
      accessible={true}
      accessibilityLabel={title}
      accessibilityHint={subtitle}
      testID={testID}
    >
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, disabled && styles.disabledText]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, disabled && styles.disabledText]}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightComponent}
    </Component>
  );
};

const SettingsScreen: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleCurrencySelect = useCallback(async (currencyCode: CurrencyCode) => {
    try {
      setIsUpdating(true);
      await updateSettings({ currency: currencyCode });
      setShowCurrencyModal(false);
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to update currency. Please try again.',
        [{ text: 'OK' }]
      );
      console.error('Currency update error:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [updateSettings]);

  const handleNotificationToggle = useCallback(async (value: boolean) => {
    try {
      await updateSettings({ notificationsEnabled: value });
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to update notification settings. Please try again.',
        [{ text: 'OK' }]
      );
      console.error('Notification update error:', error);
    }
  }, [updateSettings]);

  const currentCurrency = currencyOptions.find(c => c.code === settings.currency);

  const renderCurrencyDisplay = () => (
    <View style={styles.currencyDisplay}>
      <Text style={styles.currencySymbol}>
        {currentCurrency?.symbol || '?'}
      </Text>
      <Text style={styles.currencyCode}>
        {settings.currency}
      </Text>
      <MaterialIcons 
        name="chevron-right" 
        size={20} 
        color="#666"
        style={styles.chevronIcon}
      />
    </View>
  );

  const renderCurrencyModal = () => (
    <Modal
      visible={showCurrencyModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowCurrencyModal(false)}
      statusBarTranslucent={Platform.OS === 'android'}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Currency</Text>
              <TouchableOpacity
                onPress={() => setShowCurrencyModal(false)}
                style={styles.closeButton}
                accessible={true}
                accessibilityLabel="Close currency selection"
                testID="close-currency-modal"
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.currencyList}
              showsVerticalScrollIndicator={false}
            >
              {currencyOptions.map((currency) => (
                <TouchableOpacity
                  key={currency.code}
                  style={[
                    styles.currencyOption,
                    settings.currency === currency.code && styles.selectedCurrency
                  ]}
                  onPress={() => handleCurrencySelect(currency.code)}
                  disabled={isUpdating}
                  activeOpacity={0.7}
                  accessible={true}
                  accessibilityLabel={`${currency.name} ${currency.code}`}
                  accessibilityState={{ selected: settings.currency === currency.code }}
                  testID={`currency-${currency.code}`}
                >
                  <View style={styles.currencyLeft}>
                    <Text style={styles.currencySymbolText}>
                      {currency.symbol}
                    </Text>
                    <View style={styles.currencyInfo}>
                      <Text style={styles.currencyName}>
                        {currency.name}
                      </Text>
                      <Text style={styles.currencyDetails}>
                        {currency.code}
                        {currency.country && ` • ${currency.country}`}
                      </Text>
                    </View>
                  </View>
                  {settings.currency === currency.code && (
                    <MaterialIcons 
                      name="check" 
                      size={24} 
                      color="#3498db" 
                      style={styles.checkIcon}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Currency Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              title="Currency"
              subtitle={`${currentCurrency?.name || 'Unknown'} (${settings.currency})`}
              onPress={() => setShowCurrencyModal(true)}
              rightComponent={renderCurrencyDisplay()}
              testID="currency-setting"
            />
          </View>
        </View>


        {/* App Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              title="App Version"
              subtitle="1.0.0"
              testID="version-setting"
            />
          </View>
        </View>
      </ScrollView>

      {renderCurrencyModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8e8e93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 16,
  },
  sectionContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e1e1e1',
  },
  settingContent: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1c1c1e',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#8e8e93',
    lineHeight: 18,
  },
  disabledItem: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#c7c7cc',
  },
  currencyDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currencySymbol: {
    fontSize: 18,
    color: '#1c1c1e',
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  currencyCode: {
    fontSize: 16,
    color: '#8e8e93',
    fontWeight: '500',
  },
  chevronIcon: {
    marginLeft: 4,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSafeArea: {
    backgroundColor: 'transparent',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e1e1e1',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f2f2f7',
  },
  currencyList: {
    maxHeight: 400,
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e1e1e1',
  },
  selectedCurrency: {
    backgroundColor: '#f0f8ff',
  },
  currencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currencySymbolText: {
    fontSize: 24,
    width: 40,
    color: '#1c1c1e',
    fontWeight: '600',
    textAlign: 'center',
  },
  currencyInfo: {
    flex: 1,
    marginLeft: 16,
  },
  currencyName: {
    fontSize: 16,
    color: '#1c1c1e',
    fontWeight: '500',
    marginBottom: 2,
  },
  currencyDetails: {
    fontSize: 14,
    color: '#8e8e93',
  },
  checkIcon: {
    marginLeft: 12,
  },
});

// Ensure proper default export
export default SettingsScreen;