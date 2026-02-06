import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../providers/auth_provider.dart';
import '../../theme/app_theme.dart';

/// 로그인 화면
/// 이메일/비밀번호 입력, 로그인 유지 옵션, 비밀번호 찾기·회원가입 링크를 제공합니다.
/// AuthNotifier와 연동하여 유효성 검증·Supabase 로그인·회원 상태 확인 후
/// 오류 메시지를 인라인(SelectableText.rich, 빨간색)으로 표시합니다.
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({
    super.key,
    this.onLoginSuccess,
    this.onPendingApproval,
    this.onForgotPassword,
    this.onSignUp,
  });

  /// 로그인 성공 시 호출 (상태별 리다이렉트)
  final VoidCallback? onLoginSuccess;

  /// 가입 대기(승인 진행중) 시 호출
  final VoidCallback? onPendingApproval;

  /// 비밀번호 찾기 탭 시 호출
  final VoidCallback? onForgotPassword;

  /// 회원가입 탭 시 호출
  final VoidCallback? onSignUp;

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

const _keyRememberMe = 'auth_remember_me';

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _rememberMe = false;
  SharedPreferences? _prefs;

  @override
  void initState() {
    super.initState();
    SharedPreferences.getInstance().then((prefs) {
      if (!mounted) return;
      setState(() {
        _prefs = prefs;
        _rememberMe = prefs.getBool(_keyRememberMe) ?? false;
      });
    });
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _setRememberMe(bool value) {
    setState(() => _rememberMe = value);
    _prefs?.setBool(_keyRememberMe, value);
  }

  void _submit() {
    ref.read(authNotifierProvider.notifier).clearResult();
    ref.read(authNotifierProvider.notifier).login(
          _emailController.text.trim(),
          _passwordController.text,
          _rememberMe,
        );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authNotifierProvider);

    ref.listen<AuthLoginState>(authNotifierProvider, (prev, next) {
      next.whenOrNull(
        data: (result) {
          if (result is LoginSuccess) {
            widget.onLoginSuccess?.call();
          }
          if (result is LoginPendingApproval) {
            widget.onPendingApproval?.call();
          }
        },
      );
    });

    String? emailError;
    String? passwordError;
    String? inlineMessage;

    final result = authState.valueOrNull;
    if (result is LoginValidationError) {
      emailError = result.emailError;
      passwordError = result.passwordError;
    }
    if (result is LoginRejected) {
      inlineMessage = result.reason?.isNotEmpty == true
          ? result.reason!
          : '가입이 거절되었습니다.';
    }
    if (result is LoginSuspended) {
      inlineMessage = '계정이 정지되었습니다. 관리자에게 문의하세요.';
    }
    if (result is LoginWithdrawn) {
      inlineMessage = '탈퇴한 계정입니다.';
    }
    if (result is LoginFailure) {
      inlineMessage = result.message;
    }

    final isLoading = authState.isLoading;

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('로그인'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 24),
              _EmailField(
                controller: _emailController,
                errorText: emailError,
              ),
              const SizedBox(height: 16),
              _PasswordField(
                controller: _passwordController,
                obscureText: _obscurePassword,
                onToggleVisibility: () {
                  setState(() => _obscurePassword = !_obscurePassword);
                },
                onSubmit: _submit,
                errorText: passwordError,
              ),
              if (inlineMessage != null) ...[
                const SizedBox(height: 12),
                _InlineErrorMessage(message: inlineMessage),
              ],
              const SizedBox(height: 12),
              _RememberMeOption(
                value: _rememberMe,
                onChanged: (v) => _setRememberMe(v ?? false),
              ),
              const SizedBox(height: 24),
              _LoginButton(
                onPressed: isLoading ? null : _submit,
                isLoading: isLoading,
              ),
              const SizedBox(height: 24),
              _SecondaryLinksRow(
                onForgotPassword:
                    isLoading ? null : widget.onForgotPassword,
                onSignUp: isLoading ? null : widget.onSignUp,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// 오류 메시지 인라인 표시 (SelectableText.rich, 빨간색)
class _InlineErrorMessage extends StatelessWidget {
  const _InlineErrorMessage({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return SelectableText.rich(
      TextSpan(
        text: message,
        style: TextStyle(
          color: AppTheme.errorColor,
          fontSize: 14,
          height: 1.4,
        ),
      ),
    );
  }
}

/// 이메일 입력 필드
class _EmailField extends StatelessWidget {
  const _EmailField({
    required this.controller,
    this.errorText,
  });

  final TextEditingController controller;
  final String? errorText;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      decoration: InputDecoration(
        labelText: '이메일',
        hintText: 'example@email.com',
        prefixIcon: const Icon(Icons.email_outlined),
        errorText: errorText,
      ),
      keyboardType: TextInputType.emailAddress,
      textInputAction: TextInputAction.next,
      textCapitalization: TextCapitalization.none,
      autocorrect: false,
    );
  }
}

/// 비밀번호 입력 필드 (표시/숨김 토글 포함)
class _PasswordField extends StatelessWidget {
  const _PasswordField({
    required this.controller,
    required this.obscureText,
    required this.onToggleVisibility,
    required this.onSubmit,
    this.errorText,
  });

  final TextEditingController controller;
  final bool obscureText;
  final VoidCallback onToggleVisibility;
  final VoidCallback onSubmit;
  final String? errorText;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      decoration: InputDecoration(
        labelText: '비밀번호',
        hintText: '8자 이상 입력',
        prefixIcon: const Icon(Icons.lock_outline),
        suffixIcon: IconButton(
          icon: Icon(
            obscureText ? Icons.visibility_off : Icons.visibility,
            color: AppTheme.textSecondary,
          ),
          onPressed: onToggleVisibility,
        ),
        errorText: errorText,
      ),
      obscureText: obscureText,
      textInputAction: TextInputAction.done,
      onSubmitted: (_) => onSubmit(),
    );
  }
}

/// 로그인 유지 옵션
class _RememberMeOption extends StatelessWidget {
  const _RememberMeOption({
    required this.value,
    required this.onChanged,
  });

  final bool value;
  final ValueChanged<bool?> onChanged;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: MergeSemantics(
        child: InkWell(
          onTap: () => onChanged(!value),
          borderRadius: BorderRadius.circular(8),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Checkbox(
                  value: value,
                  onChanged: onChanged,
                  activeColor: AppTheme.primaryColor,
                ),
                Text(
                  '로그인 유지',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppTheme.textPrimary,
                      ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// 로그인 버튼
class _LoginButton extends StatelessWidget {
  const _LoginButton({
    required this.onPressed,
    this.isLoading = false,
  });

  final VoidCallback? onPressed;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 48,
      child: ElevatedButton(
        onPressed: onPressed,
        child: isLoading
            ? const SizedBox(
                height: 24,
                width: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.white,
                ),
              )
            : const Text('로그인'),
      ),
    );
  }
}

/// 비밀번호 찾기 / 회원가입 링크 행
class _SecondaryLinksRow extends StatelessWidget {
  const _SecondaryLinksRow({
    this.onForgotPassword,
    this.onSignUp,
  });

  final VoidCallback? onForgotPassword;
  final VoidCallback? onSignUp;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        TextButton(
          onPressed: onForgotPassword,
          child: const Text('비밀번호 찾기'),
        ),
        Text(
          '|',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppTheme.textSecondary,
              ),
        ),
        TextButton(
          onPressed: onSignUp,
          child: const Text('회원가입'),
        ),
      ],
    );
  }
}
