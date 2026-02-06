import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../providers/signup_provider.dart';
import '../../theme/app_theme.dart';
import '../../utils/text_formatters.dart';
import '../../widgets/address_search_dialog.dart';
import '../../widgets/validation_dialog.dart';
import 'pending_approval_screen.dart';

/// 회원가입 화면 (6단계 폼)
/// Step 1: 로그인 정보
/// Step 2: 기본 정보
/// Step 3: 직장 정보 (선택)
/// Step 4: 학력/경력 정보
/// Step 5: 가족 정보
/// Step 6: 기타 정보
class SignupScreen extends ConsumerStatefulWidget {
  const SignupScreen({
    super.key,
    this.onSignupComplete,
    this.onCancel,
  });

  /// 회원가입 완료 시 호출
  final VoidCallback? onSignupComplete;

  /// 취소 시 호출
  final VoidCallback? onCancel;

  @override
  ConsumerState<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends ConsumerState<SignupScreen> {
  final _pageController = PageController();
  int _currentStep = 0;
  static const _totalSteps = 6;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _handleSignupComplete() {
    // 승인 진행중 화면으로 이동
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (context) => PendingApprovalScreen(
          onConfirm: widget.onSignupComplete,
        ),
      ),
    );
  }

  void _showEmailConfirmationDialog() {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('이메일 인증 필요'),
        content: const Text(
          '가입하신 이메일로 인증 링크를 보냈습니다. '
          '링크를 눌러 인증을 완료한 후 로그인해 주세요.',
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              Navigator.pop(context);
            },
            child: const Text('확인'),
          ),
        ],
      ),
    );
  }

  void _nextStep() {
    if (_currentStep < _totalSteps - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _previousStep() {
    if (_currentStep > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<SignupState>(signupNotifierProvider, (prev, next) {
      next.whenOrNull(
        data: (result) {
          if (result is SignupSuccess) {
            if (result.emailConfirmationRequired) {
              _showEmailConfirmationDialog();
              return;
            }
            _handleSignupComplete();
          }
          if (result is SignupValidationError) {
            final errorFields = result.errors.keys
                .map(getFieldDisplayName)
                .toList();
            ValidationDialog.show(
              context: context,
              title: '입력 확인',
              message: '다음 항목을 확인해 주세요.',
              fields: errorFields,
            );
          }
          if (result is SignupFailure) {
            // 동일 실패로 중복 팝업 방지 (이전 상태가 이미 실패가 아닐 때만 표시)
            final prevFailure = prev?.valueOrNull is SignupFailure;
            if (!prevFailure) {
              ErrorDialog.show(
                context: context,
                title: '회원가입 실패',
                message: result.message,
              );
            }
          }
        },
      );
    });

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('회원가입'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: widget.onCancel,
        ),
      ),
      body: Column(
        children: [
          _ProgressIndicator(
            currentStep: _currentStep,
            totalSteps: _totalSteps,
          ),
          Expanded(
            child: PageView(
              controller: _pageController,
              physics: const NeverScrollableScrollPhysics(),
              onPageChanged: (index) {
                setState(() => _currentStep = index);
              },
              children: [
                _Step1LoginInfo(
                  onNext: _nextStep,
                  currentStep: _currentStep,
                  stepIndex: 0,
                ),
                _Step2BasicInfo(
                  onNext: _nextStep,
                  onPrevious: _previousStep,
                  currentStep: _currentStep,
                  stepIndex: 1,
                ),
                _Step3CompanyInfo(
                  onNext: _nextStep,
                  onPrevious: _previousStep,
                  currentStep: _currentStep,
                  stepIndex: 2,
                ),
                _Step4EducationCareer(
                  onNext: _nextStep,
                  onPrevious: _previousStep,
                  currentStep: _currentStep,
                  stepIndex: 3,
                ),
                _Step5FamilyInfo(
                  onNext: _nextStep,
                  onPrevious: _previousStep,
                  currentStep: _currentStep,
                  stepIndex: 4,
                ),
                _Step6OtherInfo(
                  onPrevious: _previousStep,
                  onComplete: widget.onSignupComplete,
                  currentStep: _currentStep,
                  stepIndex: 5,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// 상단 진행 표시 (1/6, 2/6 등)
class _ProgressIndicator extends StatelessWidget {
  const _ProgressIndicator({
    required this.currentStep,
    required this.totalSteps,
  });

  final int currentStep;
  final int totalSteps;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Step ${currentStep + 1}/$totalSteps',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppTheme.textSecondary,
                      fontWeight: FontWeight.w600,
                    ),
              ),
              Text(
                _getStepTitle(currentStep),
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppTheme.textPrimary,
                      fontWeight: FontWeight.w600,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          LinearProgressIndicator(
            value: (currentStep + 1) / totalSteps,
            backgroundColor: AppTheme.secondaryColor,
            valueColor: const AlwaysStoppedAnimation(AppTheme.primaryColor),
            minHeight: 6,
            borderRadius: BorderRadius.circular(3),
          ),
        ],
      ),
    );
  }

  String _getStepTitle(int step) {
    switch (step) {
      case 0:
        return '로그인 정보';
      case 1:
        return '기본 정보';
      case 2:
        return '직장 정보';
      case 3:
        return '학력/경력';
      case 4:
        return '가족 정보';
      case 5:
        return '기타 정보';
      default:
        return '';
    }
  }
}

/// 필수/선택 라벨
class _RequiredLabel extends StatelessWidget {
  const _RequiredLabel({this.isRequired = true});

  final bool isRequired;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: isRequired
            ? AppTheme.errorColor.withOpacity(0.1)
            : AppTheme.textSecondary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        isRequired ? '필수' : '선택',
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: isRequired ? AppTheme.errorColor : AppTheme.textSecondary,
        ),
      ),
    );
  }
}

/// Step1 이메일 입력창 아래: 사용 가능 / 이미 사용 중 멘트
class _EmailAvailabilityMessage extends ConsumerWidget {
  const _EmailAvailabilityMessage({required this.emailForCheck});

  final String emailForCheck;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (emailForCheck.isEmpty) return const SizedBox(height: 8);
    final availability = ref.watch(emailAvailabilityProvider(emailForCheck));
    return availability.when(
      data: (bool? available) {
        if (available == null) return const SizedBox(height: 8);
        return Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Text(
            available
                ? '사용 가능한 이메일이에요.'
                : '이미 사용 중인 이메일이에요.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: available
                      ? AppTheme.primaryColor
                      : AppTheme.errorColor,
                ),
          ),
        );
      },
      loading: () => Padding(
        padding: const EdgeInsets.only(top: 8),
        child: Text(
          '확인 중...',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppTheme.textSecondary,
              ),
        ),
      ),
      error: (_, __) => const SizedBox(height: 8),
    );
  }
}

/// Step2 주민등록번호 입력창 아래: 사용 가능 / 이미 등록된 번호 멘트
class _ResidentIdAvailabilityMessage extends ConsumerWidget {
  const _ResidentIdAvailabilityMessage({
    required this.residentIdForCheck,
  });

  final String residentIdForCheck;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (residentIdForCheck.length != 13) return const SizedBox(height: 8);
    final availability =
        ref.watch(residentIdAvailabilityProvider(residentIdForCheck));
    return availability.when(
      data: (bool? available) {
        if (available == null) return const SizedBox(height: 8);
        return Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Text(
            available
                ? '사용 가능한 주민등록번호예요.'
                : '이미 등록된 주민등록번호예요.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: available
                      ? AppTheme.primaryColor
                      : AppTheme.errorColor,
                ),
          ),
        );
      },
      loading: () => Padding(
        padding: const EdgeInsets.only(top: 8),
        child: Text(
          '확인 중...',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppTheme.textSecondary,
              ),
        ),
      ),
      error: (_, __) => const SizedBox(height: 8),
    );
  }
}

/// Step2 휴대폰 입력창 아래: 사용 가능 / 이미 등록된 번호 멘트
class _PhoneAvailabilityMessage extends ConsumerWidget {
  const _PhoneAvailabilityMessage({required this.phoneForCheck});

  final String phoneForCheck;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final digits = phoneForCheck.replaceAll(RegExp(r'[^0-9]'), '');
    if (digits.length < 10) return const SizedBox(height: 8);
    final availability = ref.watch(phoneAvailabilityProvider(phoneForCheck));
    return availability.when(
      data: (bool? available) {
        if (available == null) return const SizedBox(height: 8);
        return Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Text(
            available
                ? '사용 가능한 휴대폰 번호예요.'
                : '이미 등록된 휴대폰 번호예요.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: available
                      ? AppTheme.primaryColor
                      : AppTheme.errorColor,
                ),
          ),
        );
      },
      loading: () => Padding(
        padding: const EdgeInsets.only(top: 8),
        child: Text(
          '확인 중...',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: AppTheme.textSecondary,
              ),
        ),
      ),
      error: (_, __) => const SizedBox(height: 8),
    );
  }
}

/// Step 1: 로그인 정보 (이메일, 비밀번호, 비밀번호 확인)
class _Step1LoginInfo extends ConsumerStatefulWidget {
  const _Step1LoginInfo({
    required this.onNext,
    required this.currentStep,
    required this.stepIndex,
  });

  final VoidCallback onNext;
  final int currentStep;
  final int stepIndex;

  @override
  ConsumerState<_Step1LoginInfo> createState() => _Step1LoginInfoState();
}

class _Step1LoginInfoState extends ConsumerState<_Step1LoginInfo> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _passwordConfirmController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscurePasswordConfirm = true;
  /// 이메일 중복 확인용 디바운스 (입력창 아래 멘트)
  String _emailForCheck = '';
  Timer? _emailDebounce;
  bool _hadRestoredThisVisit = false;

  @override
  void didUpdateWidget(covariant _Step1LoginInfo oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.currentStep != widget.stepIndex) _hadRestoredThisVisit = false;
  }

  @override
  void dispose() {
    _emailDebounce?.cancel();
    _emailController.dispose();
    _passwordController.dispose();
    _passwordConfirmController.dispose();
    super.dispose();
  }

  void _restoreFromNotifier() {
    final data = ref.read(signupNotifierProvider.notifier).data;
    if (data.email != null && data.email!.isNotEmpty) {
      _emailController.text = data.email!;
      if (_emailForCheck.isEmpty) _emailForCheck = data.email!.trim();
    }
    if (data.password != null && data.password!.isNotEmpty) {
      _passwordController.text = data.password!;
    }
    if (data.passwordConfirm != null && data.passwordConfirm!.isNotEmpty) {
      _passwordConfirmController.text = data.passwordConfirm!;
    }
  }

  void _onEmailChanged(String value) {
    ref.read(signupNotifierProvider.notifier).data.email = value;
    _emailDebounce?.cancel();
    _emailDebounce = Timer(const Duration(milliseconds: 500), () {
      if (mounted) setState(() => _emailForCheck = value.trim());
    });
  }

  void _validateAndNext() {
    final errors = ref.read(signupNotifierProvider.notifier).validateStep1Data();
    if (errors.isNotEmpty) {
      ValidationDialog.show(
        context: context,
        title: '입력 확인',
        message: '다음 항목을 입력해 주세요.',
        fields: errors.keys.map(getFieldDisplayName).toList(),
      );
      return;
    }
    widget.onNext();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.currentStep == widget.stepIndex && !_hadRestoredThisVisit) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        _restoreFromNotifier();
        setState(() => _hadRestoredThisVisit = true);
      });
    }
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Text(
                '이메일',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(width: 8),
              const _RequiredLabel(),
            ],
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _emailController,
            decoration: const InputDecoration(
              hintText: 'example@email.com',
              prefixIcon: Icon(Icons.email_outlined),
            ),
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
            inputFormatters: [LowerCaseTextInputFormatter()],
            onChanged: _onEmailChanged,
          ),
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Text(
              '이메일 주소는 소문자로 입력해 주세요.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppTheme.textSecondary,
                  ),
            ),
          ),
          _EmailAvailabilityMessage(emailForCheck: _emailForCheck),
          const SizedBox(height: 24),
          Row(
            children: [
              Text(
                '비밀번호',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(width: 8),
              const _RequiredLabel(),
            ],
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _passwordController,
            decoration: InputDecoration(
              hintText: '8자 이상 입력',
              prefixIcon: const Icon(Icons.lock_outline),
              suffixIcon: IconButton(
                icon: Icon(
                  _obscurePassword
                      ? Icons.visibility_off
                      : Icons.visibility,
                  color: AppTheme.textSecondary,
                ),
                onPressed: () {
                  setState(() => _obscurePassword = !_obscurePassword);
                },
              ),
            ),
            obscureText: _obscurePassword,
            textInputAction: TextInputAction.next,
            onChanged: (value) {
              ref.read(signupNotifierProvider.notifier).data.password = value;
            },
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Text(
                '비밀번호 확인',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(width: 8),
              const _RequiredLabel(),
            ],
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _passwordConfirmController,
            decoration: InputDecoration(
              hintText: '비밀번호 재입력',
              prefixIcon: const Icon(Icons.lock_outline),
              suffixIcon: IconButton(
                icon: Icon(
                  _obscurePasswordConfirm
                      ? Icons.visibility_off
                      : Icons.visibility,
                  color: AppTheme.textSecondary,
                ),
                onPressed: () {
                  setState(() => _obscurePasswordConfirm =
                      !_obscurePasswordConfirm);
                },
              ),
            ),
            obscureText: _obscurePasswordConfirm,
            textInputAction: TextInputAction.done,
            onChanged: (value) {
              ref
                  .read(signupNotifierProvider.notifier)
                  .data
                  .passwordConfirm = value;
            },
          ),
          const SizedBox(height: 32),
          SizedBox(
            height: 48,
            child: ElevatedButton(
              onPressed: _validateAndNext,
              child: const Text('다음'),
            ),
          ),
          SizedBox(height: MediaQuery.of(context).padding.bottom + 8),
        ],
      ),
    );
  }
}

/// Step 2: 기본 정보 (프로필 사진, 성명, 주민등록번호, 주소, 휴대폰)
class _Step2BasicInfo extends ConsumerStatefulWidget {
  const _Step2BasicInfo({
    required this.onNext,
    required this.onPrevious,
    required this.currentStep,
    required this.stepIndex,
  });

  final VoidCallback onNext;
  final VoidCallback onPrevious;
  final int currentStep;
  final int stepIndex;

  @override
  ConsumerState<_Step2BasicInfo> createState() => _Step2BasicInfoState();
}

class _Step2BasicInfoState extends ConsumerState<_Step2BasicInfo> {
  final _nameController = TextEditingController();
  final _residentIdController = TextEditingController();
  final _addressController = TextEditingController();
  final _addressDetailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _residentIdFormatter = ResidentIdFormatter();
  File? _profilePhoto;
  bool _hadRestoredThisVisit = false;
  String _residentIdForCheck = '';
  String _phoneForCheck = '';
  Timer? _residentIdDebounce;
  Timer? _phoneDebounce;

  @override
  void didUpdateWidget(covariant _Step2BasicInfo oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.currentStep != widget.stepIndex) _hadRestoredThisVisit = false;
  }

  void _restoreFromNotifier() {
    final data = ref.read(signupNotifierProvider.notifier).data;
    if (data.name != null && data.name!.isNotEmpty) {
      _nameController.text = data.name!;
    }
    if (data.residentId != null && data.residentId!.isNotEmpty) {
      _residentIdFormatter.setRawValue(data.residentId!);
      _residentIdController.text = _residentIdFormatter.masked;
    }
    if (data.address != null && data.address!.isNotEmpty) {
      _addressController.text = data.address!;
    }
    if (data.addressDetail != null && data.addressDetail!.isNotEmpty) {
      _addressDetailController.text = data.addressDetail!;
    }
    if (data.phone != null && data.phone!.isNotEmpty) {
      _phoneController.text = data.phone!;
    }
    if (data.profilePhoto != null) {
      _profilePhoto = data.profilePhoto;
    } else if (data.profilePhotoUrl != null &&
        data.profilePhotoUrl!.isNotEmpty) {
      // URL만 있고 File이 없으면 UI에서는 비움 (재선택 유도)
    }
  }

  @override
  void dispose() {
    _residentIdDebounce?.cancel();
    _phoneDebounce?.cancel();
    _nameController.dispose();
    _residentIdController.dispose();
    _addressController.dispose();
    _addressDetailController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  void _onResidentIdChanged() {
    ref.read(signupNotifierProvider.notifier).data.residentId =
        _residentIdFormatter.rawValue;
    _residentIdDebounce?.cancel();
    _residentIdDebounce = Timer(const Duration(milliseconds: 500), () {
      if (mounted) {
        final raw = _residentIdFormatter.rawValue;
        setState(() => _residentIdForCheck = raw.length == 13 ? raw : '');
      }
    });
  }

  void _onPhoneChanged(String value) {
    ref.read(signupNotifierProvider.notifier).data.phone = value;
    _phoneDebounce?.cancel();
    _phoneDebounce = Timer(const Duration(milliseconds: 500), () {
      if (mounted) setState(() => _phoneForCheck = value);
    });
  }

  Future<void> _pickProfilePhoto() async {
    final source = await showDialog<ImageSource>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('프로필 사진 선택'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('카메라'),
              onTap: () => Navigator.pop(context, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('갤러리'),
              onTap: () => Navigator.pop(context, ImageSource.gallery),
            ),
          ],
        ),
      ),
    );

    if (source != null) {
      final picker = ImagePicker();
      final image = await picker.pickImage(source: source);
      if (image != null) {
        setState(() {
          _profilePhoto = File(image.path);
        });
        ref.read(signupNotifierProvider.notifier).data.profilePhoto =
            _profilePhoto;
      }
    }
  }

  Future<void> _searchAddress() async {
    final result = await showDialog<AddressResult>(
      context: context,
      builder: (context) => const AddressSearchDialog(),
    );

    if (result != null) {
      setState(() {
        _addressController.text = result.address;
      });
      ref.read(signupNotifierProvider.notifier).data.address = result.address;
    }
  }

  void _validateAndNext() {
    final errors = ref.read(signupNotifierProvider.notifier).validateStep2Data();
    if (errors.isNotEmpty) {
      ValidationDialog.show(
        context: context,
        title: '입력 확인',
        message: '다음 항목을 입력해 주세요.',
        fields: errors.keys.map(getFieldDisplayName).toList(),
      );
      return;
    }
    widget.onNext();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.currentStep == widget.stepIndex && !_hadRestoredThisVisit) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        _restoreFromNotifier();
        setState(() => _hadRestoredThisVisit = true);
      });
    }
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Text(
                '프로필 사진',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(width: 8),
              const _RequiredLabel(),
            ],
          ),
          const SizedBox(height: 12),
          Center(
            child: GestureDetector(
              onTap: _pickProfilePhoto,
              child: Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  color: AppTheme.secondaryColor,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AppTheme.primaryColor.withOpacity(0.3),
                    width: 2,
                  ),
                  image: _profilePhoto != null
                      ? DecorationImage(
                          image: FileImage(_profilePhoto!),
                          fit: BoxFit.cover,
                        )
                      : null,
                ),
                child: _profilePhoto == null
                    ? const Icon(
                        Icons.add_a_photo,
                        size: 40,
                        color: AppTheme.primaryColor,
                      )
                    : null,
              ),
            ),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Text(
                '성명',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(width: 8),
              const _RequiredLabel(),
            ],
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _nameController,
            decoration: const InputDecoration(
              hintText: '홍길동',
              prefixIcon: Icon(Icons.person_outline),
            ),
            textInputAction: TextInputAction.next,
            onChanged: (value) {
              ref.read(signupNotifierProvider.notifier).data.name = value;
            },
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Text(
                '주민등록번호',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(width: 8),
              const _RequiredLabel(),
            ],
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _residentIdController,
            decoration: const InputDecoration(
              hintText: '000000-0******',
              prefixIcon: Icon(Icons.badge_outlined),
              helperText: '8번째 자리부터 자동으로 마스킹됩니다',
            ),
            keyboardType: TextInputType.number,
            textInputAction: TextInputAction.next,
            inputFormatters: [
              _residentIdFormatter,
            ],
            onChanged: (_) => _onResidentIdChanged(),
          ),
          _ResidentIdAvailabilityMessage(residentIdForCheck: _residentIdForCheck),
          const SizedBox(height: 24),
          Row(
            children: [
              Text(
                '주소',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(width: 8),
              const _RequiredLabel(),
            ],
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _addressController,
            decoration: InputDecoration(
              hintText: '주소 검색',
              prefixIcon: const Icon(Icons.home_outlined),
              suffixIcon: IconButton(
                icon: const Icon(Icons.search),
                onPressed: _searchAddress,
              ),
            ),
            readOnly: true,
            onTap: _searchAddress,
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Text(
                '상세 주소',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(width: 8),
              const _RequiredLabel(isRequired: false),
            ],
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _addressDetailController,
            decoration: const InputDecoration(
              hintText: '동, 호수 등 상세 주소 (선택)',
              prefixIcon: Icon(Icons.home_outlined),
            ),
            textInputAction: TextInputAction.next,
            onChanged: (value) {
              ref.read(signupNotifierProvider.notifier).data.addressDetail =
                  value;
            },
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Text(
                '휴대폰',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(width: 8),
              const _RequiredLabel(),
            ],
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _phoneController,
            decoration: const InputDecoration(
              hintText: '010-0000-0000',
              prefixIcon: Icon(Icons.phone_outlined),
            ),
            keyboardType: TextInputType.phone,
            textInputAction: TextInputAction.done,
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              PhoneFormatter(),
            ],
            onChanged: _onPhoneChanged,
          ),
          _PhoneAvailabilityMessage(phoneForCheck: _phoneForCheck),
          const SizedBox(height: 32),
          Row(
            children: [
              Expanded(
                child: SizedBox(
                  height: 48,
                  child: OutlinedButton(
                    onPressed: widget.onPrevious,
                    child: const Text('이전'),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: SizedBox(
                  height: 48,
                  child: ElevatedButton(
                    onPressed: _validateAndNext,
                    child: const Text('다음'),
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: MediaQuery.of(context).padding.bottom + 8),
        ],
      ),
    );
  }
}

/// Step 3: 직장 정보 (선택)
class _Step3CompanyInfo extends ConsumerStatefulWidget {
  const _Step3CompanyInfo({
    required this.onNext,
    required this.onPrevious,
    required this.currentStep,
    required this.stepIndex,
  });

  final VoidCallback onNext;
  final VoidCallback onPrevious;
  final int currentStep;
  final int stepIndex;

  @override
  ConsumerState<_Step3CompanyInfo> createState() => _Step3CompanyInfoState();
}

class _Step3CompanyInfoState extends ConsumerState<_Step3CompanyInfo> {
  final _companyNameController = TextEditingController();
  final _companyPositionController = TextEditingController();
  final _companyAddressController = TextEditingController();
  final _jobTypeController = TextEditingController();
  bool _hadRestoredThisVisit = false;

  @override
  void didUpdateWidget(covariant _Step3CompanyInfo oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.currentStep != widget.stepIndex) _hadRestoredThisVisit = false;
  }

  void _restoreFromNotifier() {
    final data = ref.read(signupNotifierProvider.notifier).data;
    if (data.companyName != null && data.companyName!.isNotEmpty) {
      _companyNameController.text = data.companyName!;
    }
    if (data.companyPosition != null && data.companyPosition!.isNotEmpty) {
      _companyPositionController.text = data.companyPosition!;
    }
    if (data.companyAddress != null && data.companyAddress!.isNotEmpty) {
      _companyAddressController.text = data.companyAddress!;
    }
    if (data.jobType != null && data.jobType!.isNotEmpty) {
      _jobTypeController.text = data.jobType!;
    }
  }

  @override
  void dispose() {
    _companyNameController.dispose();
    _companyPositionController.dispose();
    _companyAddressController.dispose();
    _jobTypeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.currentStep == widget.stepIndex && !_hadRestoredThisVisit) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        _restoreFromNotifier();
        setState(() => _hadRestoredThisVisit = true);
      });
    }
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Text(
                '회사명',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(width: 8),
              const _RequiredLabel(isRequired: false),
            ],
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _companyNameController,
            decoration: const InputDecoration(
              hintText: '회사명 입력',
              prefixIcon: Icon(Icons.business_outlined),
            ),
            textInputAction: TextInputAction.next,
            onChanged: (value) {
              ref.read(signupNotifierProvider.notifier).data.companyName =
                  value;
            },
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Text(
                '직책',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(width: 8),
              const _RequiredLabel(isRequired: false),
            ],
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _companyPositionController,
            decoration: const InputDecoration(
              hintText: '직책 입력',
              prefixIcon: Icon(Icons.work_outline),
            ),
            textInputAction: TextInputAction.next,
            onChanged: (value) {
              ref.read(signupNotifierProvider.notifier).data.companyPosition =
                  value;
            },
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Text(
                '회사 주소',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(width: 8),
              const _RequiredLabel(isRequired: false),
            ],
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _companyAddressController,
            decoration: const InputDecoration(
              hintText: '회사 주소 입력',
              prefixIcon: Icon(Icons.location_on_outlined),
            ),
            textInputAction: TextInputAction.next,
            maxLines: 2,
            onChanged: (value) {
              ref.read(signupNotifierProvider.notifier).data.companyAddress =
                  value;
            },
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Text(
                '직종',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(width: 8),
              const _RequiredLabel(isRequired: false),
            ],
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _jobTypeController,
            decoration: const InputDecoration(
              hintText: '직종 입력',
              prefixIcon: Icon(Icons.category_outlined),
            ),
            textInputAction: TextInputAction.done,
            onChanged: (value) {
              ref.read(signupNotifierProvider.notifier).data.jobType = value;
            },
          ),
          const SizedBox(height: 32),
          Row(
            children: [
              Expanded(
                child: SizedBox(
                  height: 48,
                  child: OutlinedButton(
                    onPressed: widget.onPrevious,
                    child: const Text('이전'),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: SizedBox(
                  height: 48,
                  child: ElevatedButton(
                    onPressed: widget.onNext,
                    child: const Text('다음'),
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: MediaQuery.of(context).padding.bottom + 8),
        ],
      ),
    );
  }
}

/// Step 4: 학력/경력 정보
class _Step4EducationCareer extends ConsumerStatefulWidget {
  const _Step4EducationCareer({
    required this.onNext,
    required this.onPrevious,
    required this.currentStep,
    required this.stepIndex,
  });

  final VoidCallback onNext;
  final VoidCallback onPrevious;
  final int currentStep;
  final int stepIndex;

  @override
  ConsumerState<_Step4EducationCareer> createState() =>
      _Step4EducationCareerState();
}

class _Step4EducationCareerState extends ConsumerState<_Step4EducationCareer> {
  bool _hadRestoredThisVisit = false;

  @override
  void didUpdateWidget(covariant _Step4EducationCareer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.currentStep != widget.stepIndex) _hadRestoredThisVisit = false;
  }

  Future<void> _showAddEducationDialog() async {
    final graduationDateController = TextEditingController();
    final schoolNameController = TextEditingController();

    final result = await showDialog<EducationData>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('학력 추가'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: graduationDateController,
              decoration: const InputDecoration(
                labelText: '졸업년월 (6자리)',
                hintText: '예: 202601',
              ),
              keyboardType: TextInputType.number,
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                YearMonthFormatter(),
              ],
            ),
            const SizedBox(height: 16),
            TextField(
              controller: schoolNameController,
              decoration: const InputDecoration(
                labelText: '학교명',
                hintText: '학교명을 입력하세요',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('취소'),
          ),
          ElevatedButton(
            onPressed: () {
              final date = graduationDateController.text.trim();
              final name = schoolNameController.text.trim();
              if (date.length == 6 && name.isNotEmpty) {
                Navigator.pop(
                  context,
                  EducationData(graduationDate: date, schoolName: name),
                );
              }
            },
            child: const Text('추가'),
          ),
        ],
      ),
    );

    if (result != null) {
      setState(() {
        ref.read(signupNotifierProvider.notifier).data.educations.add(result);
      });
    }
  }

  Future<void> _showAddCareerDialog() async {
    final careerDateController = TextEditingController();
    final careerDescController = TextEditingController();

    final result = await showDialog<CareerData>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('경력 추가'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: careerDateController,
              decoration: const InputDecoration(
                labelText: '경력년월 (6자리)',
                hintText: '예: 202401',
              ),
              keyboardType: TextInputType.number,
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                YearMonthFormatter(),
              ],
            ),
            const SizedBox(height: 16),
            TextField(
              controller: careerDescController,
              decoration: const InputDecoration(
                labelText: '경력 내용',
                hintText: '경력 내용을 입력하세요',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('취소'),
          ),
          ElevatedButton(
            onPressed: () {
              final date = careerDateController.text.trim();
              final desc = careerDescController.text.trim();
              if (date.length == 6 && desc.isNotEmpty) {
                Navigator.pop(
                  context,
                  CareerData(careerDate: date, careerDescription: desc),
                );
              }
            },
            child: const Text('추가'),
          ),
        ],
      ),
    );

    if (result != null) {
      setState(() {
        ref.read(signupNotifierProvider.notifier).data.careers.add(result);
      });
    }
  }

  void _removeEducation(int index) {
    setState(() {
      ref.read(signupNotifierProvider.notifier).data.educations.removeAt(index);
    });
  }

  void _removeCareer(int index) {
    setState(() {
      ref.read(signupNotifierProvider.notifier).data.careers.removeAt(index);
    });
  }

  @override
  Widget build(BuildContext context) {
    if (widget.currentStep == widget.stepIndex && !_hadRestoredThisVisit) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        setState(() => _hadRestoredThisVisit = true);
      });
    }
    final educations =
        ref.watch(signupNotifierProvider.notifier).data.educations;
    final careers = ref.watch(signupNotifierProvider.notifier).data.careers;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            '학력 정보',
            style: Theme.of(context).textTheme.displayMedium,
          ),
          const SizedBox(height: 16),
          if (educations.isEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.secondaryColor,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                children: [
                  const Icon(
                    Icons.school_outlined,
                    size: 48,
                    color: AppTheme.primaryColor,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    '학력 정보는 여러 개 추가할 수 있습니다',
                    style: Theme.of(context).textTheme.bodyMedium,
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            )
          else
            ...educations.asMap().entries.map(
                  (entry) => Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      leading: const Icon(Icons.school_outlined),
                      title: Text(entry.value.schoolName),
                      subtitle: Text(
                        '${entry.value.graduationDate.substring(0, 4)}년 '
                        '${entry.value.graduationDate.substring(4)}월',
                      ),
                      trailing: IconButton(
                        icon: const Icon(Icons.close, color: AppTheme.errorColor),
                        onPressed: () => _removeEducation(entry.key),
                      ),
                    ),
                  ),
                ),
          const SizedBox(height: 12),
          TextButton.icon(
            onPressed: _showAddEducationDialog,
            icon: const Icon(Icons.add),
            label: const Text('학력 추가'),
          ),
          const SizedBox(height: 32),
          Text(
            '경력 정보',
            style: Theme.of(context).textTheme.displayMedium,
          ),
          const SizedBox(height: 16),
          if (careers.isEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.secondaryColor,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                children: [
                  const Icon(
                    Icons.work_history_outlined,
                    size: 48,
                    color: AppTheme.primaryColor,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    '경력 정보는 여러 개 추가할 수 있습니다',
                    style: Theme.of(context).textTheme.bodyMedium,
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            )
          else
            ...careers.asMap().entries.map(
                  (entry) => Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      leading: const Icon(Icons.work_history_outlined),
                      title: Text(entry.value.careerDescription),
                      subtitle: Text(
                        '${entry.value.careerDate.substring(0, 4)}년 '
                        '${entry.value.careerDate.substring(4)}월',
                      ),
                      trailing: IconButton(
                        icon: const Icon(Icons.close, color: AppTheme.errorColor),
                        onPressed: () => _removeCareer(entry.key),
                      ),
                    ),
                  ),
                ),
          const SizedBox(height: 12),
          TextButton.icon(
            onPressed: _showAddCareerDialog,
            icon: const Icon(Icons.add),
            label: const Text('경력 추가'),
          ),
          const SizedBox(height: 32),
          Row(
            children: [
              Expanded(
                child: SizedBox(
                  height: 48,
                  child: OutlinedButton(
                    onPressed: widget.onPrevious,
                    child: const Text('이전'),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: SizedBox(
                  height: 48,
                  child: ElevatedButton(
                    onPressed: widget.onNext,
                    child: const Text('다음'),
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: MediaQuery.of(context).padding.bottom + 8),
        ],
      ),
    );
  }
}

/// Step 5: 가족 정보
class _Step5FamilyInfo extends ConsumerStatefulWidget {
  const _Step5FamilyInfo({
    required this.onNext,
    required this.onPrevious,
    required this.currentStep,
    required this.stepIndex,
  });

  final VoidCallback onNext;
  final VoidCallback onPrevious;
  final int currentStep;
  final int stepIndex;

  @override
  ConsumerState<_Step5FamilyInfo> createState() => _Step5FamilyInfoState();
}

class _Step5FamilyInfoState extends ConsumerState<_Step5FamilyInfo> {
  bool _isMarried = false;
  bool _hasChildren = false;
  final _spouseNameController = TextEditingController();
  final _spouseContactController = TextEditingController();
  final _spouseBirthdateController = TextEditingController();
  bool _hadRestoredThisVisit = false;

  @override
  void didUpdateWidget(covariant _Step5FamilyInfo oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.currentStep != widget.stepIndex) _hadRestoredThisVisit = false;
  }

  void _restoreFromNotifier() {
    final data = ref.read(signupNotifierProvider.notifier).data;
    if (data.isMarried != null) _isMarried = data.isMarried!;
    if (data.hasChildren != null) _hasChildren = data.hasChildren!;
    if (data.spouseName != null && data.spouseName!.isNotEmpty) {
      _spouseNameController.text = data.spouseName!;
    }
    if (data.spouseContact != null && data.spouseContact!.isNotEmpty) {
      _spouseContactController.text = data.spouseContact!;
    }
    if (data.spouseBirthdate != null && data.spouseBirthdate!.isNotEmpty) {
      _spouseBirthdateController.text = data.spouseBirthdate!;
    }
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final data = ref.read(signupNotifierProvider.notifier).data;
      if (data.isMarried == null) {
        data.isMarried = false;
      } else {
        _isMarried = data.isMarried!;
      }
      if (data.hasChildren == null) {
        data.hasChildren = false;
      } else {
        _hasChildren = data.hasChildren!;
      }
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _spouseNameController.dispose();
    _spouseContactController.dispose();
    _spouseBirthdateController.dispose();
    super.dispose();
  }

  void _validateAndNext() {
    final errors = ref.read(signupNotifierProvider.notifier).validateStep5Data();
    if (errors.isNotEmpty) {
      ValidationDialog.show(
        context: context,
        title: '입력 확인',
        message: '다음 항목을 입력해 주세요.',
        fields: errors.keys.map(getFieldDisplayName).toList(),
      );
      return;
    }
    widget.onNext();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.currentStep == widget.stepIndex && !_hadRestoredThisVisit) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        _restoreFromNotifier();
        setState(() => _hadRestoredThisVisit = true);
      });
    }
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Text(
                '혼인 유무',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(width: 8),
              const _RequiredLabel(),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: RadioListTile<bool>(
                  title: const Text('미혼'),
                  value: false,
                  groupValue: _isMarried,
                  onChanged: (v) {
                    setState(() => _isMarried = v ?? false);
                    ref.read(signupNotifierProvider.notifier).data.isMarried =
                        v ?? false;
                  },
                  contentPadding: EdgeInsets.zero,
                ),
              ),
              Expanded(
                child: RadioListTile<bool>(
                  title: const Text('기혼'),
                  value: true,
                  groupValue: _isMarried,
                  onChanged: (v) {
                    setState(() => _isMarried = v ?? false);
                    ref.read(signupNotifierProvider.notifier).data.isMarried =
                        v ?? false;
                  },
                  contentPadding: EdgeInsets.zero,
                ),
              ),
            ],
          ),
          if (_isMarried) ...[
            const SizedBox(height: 24),
            Row(
              children: [
                Text(
                  '배우자명',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
                const SizedBox(width: 8),
                const _RequiredLabel(),
              ],
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _spouseNameController,
              decoration: const InputDecoration(
                hintText: '배우자 이름',
                prefixIcon: Icon(Icons.person_outline),
              ),
              textInputAction: TextInputAction.next,
              onChanged: (value) {
                ref.read(signupNotifierProvider.notifier).data.spouseName =
                    value;
              },
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Text(
                  '배우자 연락처',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
                const SizedBox(width: 8),
                const _RequiredLabel(isRequired: false),
              ],
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _spouseContactController,
              decoration: const InputDecoration(
                hintText: '010-0000-0000',
                prefixIcon: Icon(Icons.phone_outlined),
              ),
              keyboardType: TextInputType.phone,
              textInputAction: TextInputAction.next,
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                PhoneFormatter(),
              ],
              onChanged: (value) {
                ref.read(signupNotifierProvider.notifier).data.spouseContact =
                    value;
              },
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Text(
                  '배우자 생년월일',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
                const SizedBox(width: 8),
                const _RequiredLabel(isRequired: false),
              ],
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _spouseBirthdateController,
              decoration: const InputDecoration(
                hintText: '19900101 (8자리)',
                prefixIcon: Icon(Icons.cake_outlined),
              ),
              keyboardType: TextInputType.number,
              textInputAction: TextInputAction.done,
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                BirthdateFormatter(),
              ],
              onChanged: (value) {
                ref
                    .read(signupNotifierProvider.notifier)
                    .data
                    .spouseBirthdate = value;
              },
            ),
          ],
          const SizedBox(height: 24),
          Row(
            children: [
              Text(
                '자녀 유무',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(width: 8),
              const _RequiredLabel(),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: RadioListTile<bool>(
                  title: const Text('없음'),
                  value: false,
                  groupValue: _hasChildren,
                  onChanged: (v) {
                    setState(() => _hasChildren = v ?? false);
                    ref.read(signupNotifierProvider.notifier).data.hasChildren =
                        v ?? false;
                  },
                  contentPadding: EdgeInsets.zero,
                ),
              ),
              Expanded(
                child: RadioListTile<bool>(
                  title: const Text('있음'),
                  value: true,
                  groupValue: _hasChildren,
                  onChanged: (v) {
                    setState(() => _hasChildren = v ?? false);
                    ref.read(signupNotifierProvider.notifier).data.hasChildren =
                        v ?? false;
                  },
                  contentPadding: EdgeInsets.zero,
                ),
              ),
            ],
          ),
          const SizedBox(height: 32),
          Row(
            children: [
              Expanded(
                child: SizedBox(
                  height: 48,
                  child: OutlinedButton(
                    onPressed: widget.onPrevious,
                    child: const Text('이전'),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: SizedBox(
                  height: 48,
                  child: ElevatedButton(
                    onPressed: _validateAndNext,
                    child: const Text('다음'),
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: MediaQuery.of(context).padding.bottom + 8),
        ],
      ),
    );
  }
}

/// Step 6: 기타 정보
class _Step6OtherInfo extends ConsumerStatefulWidget {
  const _Step6OtherInfo({
    required this.onPrevious,
    required this.onComplete,
    required this.currentStep,
    required this.stepIndex,
  });

  final VoidCallback onPrevious;
  final VoidCallback? onComplete;
  final int currentStep;
  final int stepIndex;

  @override
  ConsumerState<_Step6OtherInfo> createState() => _Step6OtherInfoState();
}

class _Step6OtherInfoState extends ConsumerState<_Step6OtherInfo> {
  final _hobbyController = TextEditingController();
  final _specialtyController = TextEditingController();
  final _recommenderController = TextEditingController();
  bool _hadRestoredThisVisit = false;

  @override
  void didUpdateWidget(covariant _Step6OtherInfo oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.currentStep != widget.stepIndex) _hadRestoredThisVisit = false;
  }

  void _restoreFromNotifier() {
    final data = ref.read(signupNotifierProvider.notifier).data;
    if (data.hobby != null && data.hobby!.isNotEmpty) {
      _hobbyController.text = data.hobby!;
    }
    if (data.specialty != null && data.specialty!.isNotEmpty) {
      _specialtyController.text = data.specialty!;
    }
    if (data.recommender != null && data.recommender!.isNotEmpty) {
      _recommenderController.text = data.recommender!;
    }
  }

  @override
  void dispose() {
    _hobbyController.dispose();
    _specialtyController.dispose();
    _recommenderController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.currentStep == widget.stepIndex && !_hadRestoredThisVisit) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        _restoreFromNotifier();
        setState(() => _hadRestoredThisVisit = true);
      });
    }
    final signupState = ref.watch(signupNotifierProvider);
    final isLoading = signupState.isLoading;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Text(
                '취미',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(width: 8),
              const _RequiredLabel(isRequired: false),
            ],
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _hobbyController,
            decoration: const InputDecoration(
              hintText: '취미 입력',
              prefixIcon: Icon(Icons.sports_soccer_outlined),
            ),
            textInputAction: TextInputAction.next,
            onChanged: (value) {
              ref.read(signupNotifierProvider.notifier).data.hobby = value;
            },
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Text(
                '특기',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(width: 8),
              const _RequiredLabel(isRequired: false),
            ],
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _specialtyController,
            decoration: const InputDecoration(
              hintText: '특기 입력',
              prefixIcon: Icon(Icons.star_outline),
            ),
            textInputAction: TextInputAction.next,
            onChanged: (value) {
              ref.read(signupNotifierProvider.notifier).data.specialty = value;
            },
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Text(
                '추천인',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(width: 8),
              const _RequiredLabel(isRequired: false),
            ],
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _recommenderController,
            decoration: const InputDecoration(
              hintText: '추천인 이름',
              prefixIcon: Icon(Icons.person_add_outlined),
            ),
            textInputAction: TextInputAction.done,
            onChanged: (value) {
              ref.read(signupNotifierProvider.notifier).data.recommender =
                  value;
            },
          ),
          const SizedBox(height: 32),
          Row(
            children: [
              Expanded(
                child: SizedBox(
                  height: 48,
                  child: OutlinedButton(
                    onPressed: widget.onPrevious,
                    child: const Text('이전'),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: SizedBox(
                  height: 48,
                  child: ElevatedButton(
                    onPressed: isLoading
                        ? null
                        : () async {
                            await ref
                                .read(signupNotifierProvider.notifier)
                                .submit();
                            final state = ref.read(signupNotifierProvider);
                            if (state.valueOrNull is SignupSuccess) {
                              widget.onComplete?.call();
                            }
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.accentColor,
                    ),
                    child: isLoading
                        ? const SizedBox(
                            height: 24,
                            width: 24,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                            ),
                          )
                        : const Text('승인 요청'),
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: MediaQuery.of(context).padding.bottom + 8),
        ],
      ),
    );
  }
}
