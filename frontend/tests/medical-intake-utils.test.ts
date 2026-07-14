import { describe, it, expect } from 'vitest';
import {
  isMinor,
  normalizeName,
  normalizeCpfForValidation,
  getCpfLast4,
  calculateRiskLevel,
  mockHash
} from '../src/lib/medical-intake/utils';

describe('Medical Intake Utilities', () => {
  it('idade menor/adulto', () => {
    // Menor
    expect(isMinor('2015-01-01')).toBe(true);
    // Adulto
    expect(isMinor('1990-01-01')).toBe(false);
  });

  it('normalização de nome', () => {
    expect(normalizeName('  João   da Silva  ')).toBe('joão da silva');
  });

  it('CPF inválido ou nulo', () => {
    expect(normalizeCpfForValidation('')).toBe('');
    expect(normalizeCpfForValidation(undefined)).toBe('');
    expect(getCpfLast4('')).toBe('');
  });

  it('CPF válido sem logar valor', () => {
    const rawCpf = '123.456.789-00';
    const normalized = normalizeCpfForValidation(rawCpf);
    expect(normalized).toBe('12345678900');
    expect(getCpfLast4(rawCpf)).toBe('8900');
  });

  it('risk_level sem alerta', () => {
    expect(calculateRiskLevel({
      has_heart_condition: false,
      has_diabetes: false
    })).toBe('nenhum');
  });

  it('risk_level atenção', () => {
    expect(calculateRiskLevel({
      has_diabetes: true
    })).toBe('atenção');
  });

  it('risk_level revisão obrigatória', () => {
    expect(calculateRiskLevel({
      has_diabetes: true,
      has_heart_condition: true
    })).toBe('revisão obrigatória');
  });
});
