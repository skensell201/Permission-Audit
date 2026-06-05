// src/components/__tests__/SearchBar.test.tsx
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SearchBar } from '../SearchBar';
import { Identity } from '../../models/PermissionNode';

jest.useFakeTimers();

const identities: Identity[] = [
  { descriptor: 'u1', displayName: 'John Doe', isGroup: false },
  { descriptor: 'g1', displayName: '[Proj]\\Team', isGroup: true },
];

function setup(onSelect = jest.fn()) {
  const search = jest.fn().mockResolvedValue(identities);
  render(<SearchBar search={search} onSelect={onSelect} />);
  return { search, onSelect };
}

describe('SearchBar', () => {
  it('debounces and shows suggestions with type badges', async () => {
    const { search } = setup();
    fireEvent.change(screen.getByPlaceholderText(/search user or group/i), { target: { value: 'john' } });
    expect(search).not.toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    expect(search).toHaveBeenCalledWith('john');
    expect(await screen.findByText('John Doe')).toBeTruthy();
    expect(screen.getByText('USER')).toBeTruthy();
    expect(screen.getByText('GROUP')).toBeTruthy();
  });

  it('fires onSelect with the chosen identity and closes the list', async () => {
    const onSelect = jest.fn();
    setup(onSelect);
    fireEvent.change(screen.getByPlaceholderText(/search user or group/i), { target: { value: 'john' } });
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    fireEvent.click(await screen.findByText('John Doe'));
    expect(onSelect).toHaveBeenCalledWith(identities[0]);
    expect(screen.queryByText('[Proj]\\Team')).toBeNull();
  });
});
