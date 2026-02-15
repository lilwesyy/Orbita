'use server';

import { signIn, signOut as authSignOut } from '@/lib/auth';
import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';

interface LoginFormState {
  error?: string;
}

export async function login(
  prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const email = formData.get('email');
  const password = formData.get('password');

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  try {
    await signIn('credentials', {
      email: email.toString(),
      password: password.toString(),
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Invalid credentials' };
        default:
          return { error: 'An error occurred. Please try again.' };
      }
    }
    throw error;
  }

  redirect('/');
}

export async function loginWithGitHub(): Promise<void> {
  await signIn('github', { redirectTo: '/' });
}

export async function logout(): Promise<void> {
  await authSignOut({ redirect: false });
  redirect('/login');
}
