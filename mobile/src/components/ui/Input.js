import React from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES, FONTS } from '../../constants/theme';

const Input = ({ 
  label, 
  error, 
  placeholder, 
  value, 
  onChangeText, 
  secureTextEntry, 
  keyboardType,
  icon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  isDark = false
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, isDark && { color: COLORS.pos.muted }]}>{label}</Text>}
      <View style={[
        styles.inputWrapper, 
        isDark ? styles.inputWrapperDark : styles.inputWrapperLight,
        error && styles.inputError,
        inputStyle
      ]}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          style={[
            styles.input, 
            isDark ? { color: COLORS.pos.text } : { color: COLORS.gray[900] }
          ]}
          placeholder={placeholder}
          placeholderTextColor={isDark ? COLORS.pos.muted : COLORS.gray[400]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize="none"
          textAlignVertical="center"
        />
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIconContainer}
            activeOpacity={0.7}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: SIZES.sm,
    ...FONTS.medium,
    color: COLORS.gray[700],
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 54,
  },
  inputWrapperLight: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.gray[300],
  },
  inputWrapperDark: {
    backgroundColor: COLORS.pos.card,
    borderColor: COLORS.pos.border,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: SIZES.base,
    paddingVertical: 0,
    ...FONTS.regular,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: SIZES.xs,
    marginTop: 4,
  },
  iconContainer: {
    marginRight: 12,
  },
  rightIconContainer: {
    marginLeft: 8,
    padding: 2,
  },
});

export default Input;
