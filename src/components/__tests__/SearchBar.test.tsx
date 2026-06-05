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

  it('ignores stale results from an older slower search', async () => {
    let resolveFirst!: (v: Identity[]) => void;
    const search = jest
      .fn()
      .mockImplementationOnce(() => new Promise<Identity[]>((r) => { resolveFirst = r; }))
      .mockImplementationOnce(() => Promise.resolve([identities[1]]));
    render(<SearchBar search={search} onSelect={jest.fn()} />);
    const input = screen.getByPlaceholderText(/search user or group/i);
    fireEvent.change(input, { target: { value: 'john' } });
    await act(async () => { jest.advanceTimersByTime(300); });
    fireEvent.change(input, { target: { value: 'team' } });
    await act(async () => { jest.advanceTimersByTime(300); });
    await act(async () => { resolveFirst(identities); }); // old response arrives last
    expect(screen.queryByText('John Doe')).toBeNull(); // stale result ignored
    expect(screen.getByText('[Proj]\\Team')).toBeTruthy();
  });

  it('clears suggestions when search rejects', async () => {
    const search = jest.fn().mockRejectedValue(new Error('network'));
    render(<SearchBar search={search} onSelect={jest.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/search user or group/i), { target: { value: 'john' } });
    await act(async () => { jest.advanceTimersByTime(300); });
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
