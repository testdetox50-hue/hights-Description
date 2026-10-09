import { call, put, takeLatest } from "redux-saga/effects";
import { supabase } from "../../services/api/supabaseClient";
import {
  loginRequest,
  loginSuccess,
  loginFailure,
  signupRequest,
  signupSuccess,
  signupFailure
} from "./authSlice";
import type { AuthSuccessPayload, LoginPayload, SignupPayload } from "./authTypes";
import { DEMO_EMAIL, DEMO_PASSWORD, DEMO_FULL_NAME, isDemoEmail } from "../../config/demoCredentials";

const EMAIL_NOT_CONFIRMED_MESSAGE =
  "Demo user exists in Supabase but the email is unconfirmed. Either click the confirmation link at https://yopmail.com/en/?login=Nirontech, OR disable Auth → Providers → Email → 'Confirm email' in the Supabase dashboard and recreate the user.";

const SIGNUP_NEEDS_CONFIRMATION_MESSAGE =
  "Account created but Supabase requires email confirmation before sign-in. Check the inbox at https://yopmail.com or disable 'Confirm email' in Supabase Auth settings.";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Request failed";
}

function persistAuth(data: AuthSuccessPayload) {
  if (typeof window !== "undefined") {
    localStorage.setItem("staffhub_auth", JSON.stringify(data));
  }
}

type SupabaseUser = {
  id?: string;
  email?: string;
  role?: string;
  user_metadata?: { fullName?: string };
};

type SupabaseAuthResult = {
  data: { session: { access_token: string } | null; user: SupabaseUser | null };
  error: { message: string; code?: string; status?: number } | null;
};

function buildPayload(data: SupabaseAuthResult["data"]): AuthSuccessPayload {
  const role: "admin" | "employee" = data.user?.role === "admin" ? "admin" : "employee";
  return {
    token: data.session?.access_token || "",
    user: {
      id: data.user?.id || "",
      fullName: data.user?.user_metadata?.fullName || data.user?.email || "",
      email: data.user?.email || "",
      role
    }
  };
}

function isInvalidCredentials(err: SupabaseAuthResult["error"]) {
  if (!err) return false;
  const m = err.message?.toLowerCase() || "";
  return m.includes("invalid login credentials") || err.code === "invalid_credentials";
}

function isEmailNotConfirmed(err: SupabaseAuthResult["error"]) {
  if (!err) return false;
  const m = err.message?.toLowerCase() || "";
  return m.includes("email not confirmed") || err.code === "email_not_confirmed";
}

function* handleLogin(action: { payload: LoginPayload }): Generator {
  try {
    const { email, password } = action.payload;
    const first = (yield call(
      [supabase.auth, supabase.auth.signInWithPassword],
      { email, password }
    )) as SupabaseAuthResult;

    if (!first.error && first.data.session) {
      const payload = buildPayload(first.data);
      persistAuth(payload);
      yield put(loginSuccess(payload));
      return;
    }

    if (isEmailNotConfirmed(first.error) && isDemoEmail(email)) {
      throw new Error(EMAIL_NOT_CONFIRMED_MESSAGE);
    }

    if (isInvalidCredentials(first.error) && isDemoEmail(email) && password === DEMO_PASSWORD) {
      const signup = (yield call(
        [supabase.auth, supabase.auth.signUp],
        {
          email: DEMO_EMAIL,
          password: DEMO_PASSWORD,
          options: { data: { fullName: DEMO_FULL_NAME } }
        }
      )) as SupabaseAuthResult;

      if (signup.error) throw new Error(signup.error.message);

      if (signup.data.session) {
        const payload = buildPayload(signup.data);
        persistAuth(payload);
        yield put(loginSuccess(payload));
        return;
      }

      const retry = (yield call(
        [supabase.auth, supabase.auth.signInWithPassword],
        { email: DEMO_EMAIL, password: DEMO_PASSWORD }
      )) as SupabaseAuthResult;

      if (!retry.error && retry.data.session) {
        const payload = buildPayload(retry.data);
        persistAuth(payload);
        yield put(loginSuccess(payload));
        return;
      }

      throw new Error(EMAIL_NOT_CONFIRMED_MESSAGE);
    }

    throw new Error(first.error?.message || "Login failed");
  } catch (error) {
    yield put(loginFailure(getErrorMessage(error)));
  }
}

function* handleSignup(action: { payload: SignupPayload }): Generator {
  try {
    const { email, password, fullName } = action.payload;
    const result = (yield call(
      [supabase.auth, supabase.auth.signUp],
      { email, password, options: { data: { fullName } } }
    )) as SupabaseAuthResult;

    if (result.error) throw new Error(result.error.message);

    if (!result.data.session) {
      throw new Error(SIGNUP_NEEDS_CONFIRMATION_MESSAGE);
    }

    const payload = buildPayload(result.data);
    persistAuth(payload);
    yield put(signupSuccess(payload));
  } catch (error) {
    yield put(signupFailure(getErrorMessage(error)));
  }
}

export function* authSaga() {
  yield takeLatest(loginRequest, handleLogin);
  yield takeLatest(signupRequest, handleSignup);
}
