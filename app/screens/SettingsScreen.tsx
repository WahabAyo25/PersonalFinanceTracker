import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Modal } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { MaterialIcons } from '@expo/vector-icons';

type CurrencyOption = {
  code: 'GBP' | 'NGN';
  symbol: string;
  name: string;
};

const currencyOptions: CurrencyOption[] = [
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
    { code: 'USD', symbol: '$', name: 'US Dollar' }, // Add USD
  ];

const SettingsScreen = () => {
  const { settings, updateSettings } = useSettings();
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

  const handleCurrencySelect = (currency: 'GBP' | 'NGN') => {
    updateSettings({ currency });
    setShowCurrencyModal(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        {/* Currency Selection */}
        <TouchableOpacity
          style={styles.row}
          onPress={() => setShowCurrencyModal(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.label}>Currency</Text>
          <View style={styles.currencyDisplay}>
            <Text style={styles.currencySymbol}>
              {currencyOptions.find(c => c.code === settings.currency)?.symbol}
            </Text>
            <Text style={styles.currencyCode}>{settings.currency}</Text>
            <MaterialIcons name="chevron-right" size={20} color="#666" />
          </View>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Notifications Toggle */}
        <View style={styles.row}>
          <Text style={styles.label}>Notifications</Text>
          <Switch
            value={settings.notificationsEnabled}
            onValueChange={(value) => updateSettings({ notificationsEnabled: value })}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.notificationsEnabled ? '#3498db' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Currency Selection Modal */}
      <Modal
        visible={showCurrencyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCurrencyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Currency</Text>
            {currencyOptions.map((currency) => (
              <TouchableOpacity
                key={currency.code}
                style={[
                  styles.currencyOption,
                  settings.currency === currency.code && styles.selectedCurrency
                ]}
                onPress={() => handleCurrencySelect(currency.code)}
                activeOpacity={0.7}
              >
                <Text style={styles.currencySymbolText}>{currency.symbol}</Text>
                <View style={styles.currencyInfo}>
                  <Text style={styles.currencyName}>{currency.name}</Text>
                  <Text style={styles.currencyCodeText}>{currency.code}</Text>
                </View>
                {settings.currency === currency.code && (
                  <MaterialIcons name="check" size={24} color="#3498db" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
    padding: 24,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 56,
    paddingVertical: 8,
  },
  label: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#ecf0f1',
    marginHorizontal: -16,
  },
  currencyDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currencySymbol: {
    fontSize: 20,
    color: '#2c3e50',
    fontWeight: '500',
  },
  currencyCode: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 4,
  },
  selectedCurrency: {
    backgroundColor: '#f8f9fa',
  },
  currencySymbolText: {
    fontSize: 24,
    width: 36,
    color: '#2c3e50',
  },
  currencyInfo: {
    flex: 1,
  },
  currencyName: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  currencyCodeText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
});

export default SettingsScreen;