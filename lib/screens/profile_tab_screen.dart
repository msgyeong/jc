import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../providers/profile_provider.dart';
import '../services/profile_service.dart';
import '../services/session_service.dart';
import '../theme/app_theme.dart';
import '../utils/image_uploader.dart';

/// 내 프로필 탭 화면
class ProfileTabScreen extends ConsumerWidget {
  const ProfileTabScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncProfile = ref.watch(profileProvider);

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('내 프로필'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: '로그아웃',
            onPressed: () => _signOut(context),
          ),
        ],
      ),
      body: asyncProfile.when(
        data: (profile) {
          if (profile == null) {
            return const Center(child: Text('프로필을 불러올 수 없습니다.'));
          }
          return _ProfileBody(profile: profile);
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('프로필 로딩 실패',
                  style: TextStyle(color: AppTheme.errorColor)),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () => ref.read(profileProvider.notifier).refresh(),
                child: const Text('다시 시도'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _signOut(BuildContext context) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('로그아웃'),
        content: const Text('로그아웃 하시겠습니까?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('취소'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('로그아웃'),
          ),
        ],
      ),
    );
    if (ok == true) {
      await SessionService.signOut();
    }
  }
}

class _ProfileBody extends ConsumerStatefulWidget {
  const _ProfileBody({required this.profile});
  final Map<String, dynamic> profile;

  @override
  ConsumerState<_ProfileBody> createState() => _ProfileBodyState();
}

class _ProfileBodyState extends ConsumerState<_ProfileBody> {
  bool _uploading = false;

  Future<void> _changeProfileImage() async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('카메라'),
              onTap: () => Navigator.pop(ctx, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('갤러리'),
              onTap: () => Navigator.pop(ctx, ImageSource.gallery),
            ),
          ],
        ),
      ),
    );
    if (source == null) return;

    setState(() => _uploading = true);
    try {
      final url = await ImageUploader.pickAndUpload(source: source);
      await ref.read(profileProvider.notifier).updateImage(url);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('프로필 사진이 변경되었습니다.')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('사진 변경 실패: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  void _editProfile() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => _ProfileEditScreen(profile: widget.profile),
      ),
    );
  }

  void _changePassword() {
    showDialog(
      context: context,
      builder: (ctx) => const _ChangePasswordDialog(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final profile = widget.profile;
    final name = profile['name'] as String? ?? '';
    final email = profile['email'] as String? ?? '';
    final phone = profile['phone'] as String? ?? '';
    final address = profile['address'] as String? ?? '';
    final profileImage = profile['profile_image'] as String?;
    final role = profile['role'] as String? ?? 'member';
    final birthDate = profile['birth_date'] as String?;
    final gender = profile['gender'] as String?;
    final company = profile['company'] as String? ?? '';
    final position = profile['position'] as String? ?? '';
    final department = profile['department'] as String? ?? '';
    final workPhone = profile['work_phone'] as String? ?? '';

    String roleLabel = switch (role) {
      'super_admin' => '총괄관리자',
      'admin' => '관리자',
      _ => '회원',
    };

    final hasWorkInfo =
        company.isNotEmpty || position.isNotEmpty || department.isNotEmpty;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          const SizedBox(height: 16),
          // 프로필 이미지
          Stack(
            children: [
              CircleAvatar(
                radius: 52,
                backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
                backgroundImage:
                    profileImage != null ? NetworkImage(profileImage) : null,
                child: profileImage == null
                    ? Text(
                        name.isNotEmpty ? name[0] : '?',
                        style: const TextStyle(
                          fontSize: 40,
                          color: AppTheme.primaryColor,
                          fontWeight: FontWeight.bold,
                        ),
                      )
                    : null,
              ),
              Positioned(
                bottom: 0,
                right: 0,
                child: GestureDetector(
                  onTap: _uploading ? null : _changeProfileImage,
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                    child: _uploading
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: Colors.white),
                          )
                        : const Icon(Icons.camera_alt,
                            size: 16, color: Colors.white),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            name,
            style: Theme.of(context)
                .textTheme
                .headlineSmall
                ?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: AppTheme.primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              roleLabel,
              style: const TextStyle(
                  color: AppTheme.primaryColor, fontWeight: FontWeight.w600),
            ),
          ),
          const SizedBox(height: 24),

          // 기본 정보
          _SectionCard(
            title: '기본 정보',
            children: [
              _InfoRow(icon: Icons.email, label: '이메일', value: email),
              if (phone.isNotEmpty)
                _InfoRow(icon: Icons.phone, label: '연락처', value: phone),
              if (address.isNotEmpty)
                _InfoRow(
                    icon: Icons.location_on, label: '주소', value: address),
              if (gender != null)
                _InfoRow(
                  icon: Icons.person,
                  label: '성별',
                  value: gender == 'male' ? '남성' : '여성',
                ),
              if (birthDate != null)
                _InfoRow(
                    icon: Icons.cake, label: '생년월일', value: birthDate),
            ],
          ),

          // 직장 정보
          if (hasWorkInfo) ...[
            const SizedBox(height: 12),
            _SectionCard(
              title: '직장 정보',
              children: [
                if (company.isNotEmpty)
                  _InfoRow(
                      icon: Icons.business, label: '회사', value: company),
                if (position.isNotEmpty)
                  _InfoRow(
                      icon: Icons.badge, label: '직책', value: position),
                if (department.isNotEmpty)
                  _InfoRow(
                      icon: Icons.groups, label: '부서', value: department),
                if (workPhone.isNotEmpty)
                  _InfoRow(
                      icon: Icons.phone_in_talk,
                      label: '직장 전화',
                      value: workPhone),
              ],
            ),
          ],

          const SizedBox(height: 20),

          // 액션 버튼들
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: _editProfile,
              icon: const Icon(Icons.edit),
              label: const Text('프로필 수정'),
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: _changePassword,
              icon: const Icon(Icons.lock_outline),
              label: const Text('비밀번호 변경'),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── 섹션 카드 ──────────────────────────────────────────

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.children});
  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primaryColor,
                  ),
            ),
            const SizedBox(height: 12),
            ...children,
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
  });
  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppTheme.textSecondary),
          const SizedBox(width: 12),
          SizedBox(
            width: 64,
            child: Text(label,
                style:
                    const TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
          ),
          Expanded(
            child: Text(value, style: Theme.of(context).textTheme.bodyMedium),
          ),
        ],
      ),
    );
  }
}

// ─── 비밀번호 변경 다이얼로그 ──────────────────────────────

class _ChangePasswordDialog extends StatefulWidget {
  const _ChangePasswordDialog();

  @override
  State<_ChangePasswordDialog> createState() => _ChangePasswordDialogState();
}

class _ChangePasswordDialogState extends State<_ChangePasswordDialog> {
  final _formKey = GlobalKey<FormState>();
  final _currentPwController = TextEditingController();
  final _newPwController = TextEditingController();
  final _confirmPwController = TextEditingController();
  bool _submitting = false;
  String? _errorMessage;

  @override
  void dispose() {
    _currentPwController.dispose();
    _newPwController.dispose();
    _confirmPwController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _submitting = true;
      _errorMessage = null;
    });
    try {
      await ProfileService.changePassword(
        currentPassword: _currentPwController.text,
        newPassword: _newPwController.text,
      );
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('비밀번호가 변경되었습니다.')),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _submitting = false;
          _errorMessage = e.toString().replaceAll('Exception: ', '');
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('비밀번호 변경'),
      content: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextFormField(
              controller: _currentPwController,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: '현재 비밀번호',
                border: OutlineInputBorder(),
              ),
              validator: (v) =>
                  (v == null || v.isEmpty) ? '현재 비밀번호를 입력하세요.' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _newPwController,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: '새 비밀번호 (6자 이상)',
                border: OutlineInputBorder(),
              ),
              validator: (v) {
                if (v == null || v.isEmpty) return '새 비밀번호를 입력하세요.';
                if (v.length < 6) return '6자 이상 입력하세요.';
                return null;
              },
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _confirmPwController,
              obscureText: true,
              decoration: const InputDecoration(
                labelText: '새 비밀번호 확인',
                border: OutlineInputBorder(),
              ),
              validator: (v) {
                if (v != _newPwController.text) return '비밀번호가 일치하지 않습니다.';
                return null;
              },
            ),
            if (_errorMessage != null) ...[
              const SizedBox(height: 8),
              Text(
                _errorMessage!,
                style: const TextStyle(color: AppTheme.errorColor, fontSize: 13),
              ),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: _submitting ? null : () => Navigator.pop(context),
          child: const Text('취소'),
        ),
        FilledButton(
          onPressed: _submitting ? null : _submit,
          child: _submitting
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('변경'),
        ),
      ],
    );
  }
}

// ─── 프로필 수정 화면 ──────────────────────────────────────

class _ProfileEditScreen extends ConsumerStatefulWidget {
  const _ProfileEditScreen({required this.profile});
  final Map<String, dynamic> profile;

  @override
  ConsumerState<_ProfileEditScreen> createState() => _ProfileEditScreenState();
}

class _ProfileEditScreenState extends ConsumerState<_ProfileEditScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _phoneController;
  late final TextEditingController _addressController;
  late final TextEditingController _birthDateController;
  late final TextEditingController _companyController;
  late final TextEditingController _positionController;
  late final TextEditingController _departmentController;
  late final TextEditingController _workPhoneController;
  String? _gender;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _nameController =
        TextEditingController(text: widget.profile['name'] as String? ?? '');
    _phoneController =
        TextEditingController(text: widget.profile['phone'] as String? ?? '');
    _addressController =
        TextEditingController(text: widget.profile['address'] as String? ?? '');
    _birthDateController = TextEditingController(
        text: widget.profile['birth_date'] as String? ?? '');
    _companyController =
        TextEditingController(text: widget.profile['company'] as String? ?? '');
    _positionController =
        TextEditingController(text: widget.profile['position'] as String? ?? '');
    _departmentController = TextEditingController(
        text: widget.profile['department'] as String? ?? '');
    _workPhoneController = TextEditingController(
        text: widget.profile['work_phone'] as String? ?? '');
    _gender = widget.profile['gender'] as String?;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _birthDateController.dispose();
    _companyController.dispose();
    _positionController.dispose();
    _departmentController.dispose();
    _workPhoneController.dispose();
    super.dispose();
  }

  Future<void> _pickBirthDate() async {
    final initial = DateTime.tryParse(_birthDateController.text) ??
        DateTime(1990, 1, 1);
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(1940),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      _birthDateController.text =
          '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _submitting = true);
    final ok = await ref.read(profileProvider.notifier).updateProfile(
          name: _nameController.text.trim(),
          phone: _phoneController.text.trim(),
          address: _addressController.text.trim(),
          birthDate: _birthDateController.text.trim(),
          gender: _gender,
          company: _companyController.text.trim(),
          position: _positionController.text.trim(),
          department: _departmentController.text.trim(),
          workPhone: _workPhoneController.text.trim(),
        );
    if (mounted) {
      setState(() => _submitting = false);
      if (ok) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('프로필이 수정되었습니다.')),
        );
        Navigator.pop(context);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('프로필 수정에 실패했습니다.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('프로필 수정'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // 기본 정보 섹션
            Text(
              '기본 정보',
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primaryColor,
                  ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(
                labelText: '이름',
                border: OutlineInputBorder(),
              ),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? '이름을 입력하세요.' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _phoneController,
              decoration: const InputDecoration(
                labelText: '연락처',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.phone,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _addressController,
              decoration: const InputDecoration(
                labelText: '주소',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            InkWell(
              onTap: _pickBirthDate,
              child: IgnorePointer(
                child: TextFormField(
                  controller: _birthDateController,
                  decoration: const InputDecoration(
                    labelText: '생년월일',
                    border: OutlineInputBorder(),
                    suffixIcon: Icon(Icons.calendar_today),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _gender,
              decoration: const InputDecoration(
                labelText: '성별',
                border: OutlineInputBorder(),
              ),
              items: const [
                DropdownMenuItem(value: 'male', child: Text('남성')),
                DropdownMenuItem(value: 'female', child: Text('여성')),
              ],
              onChanged: (v) => setState(() => _gender = v),
            ),

            const SizedBox(height: 24),

            // 직장 정보 섹션
            Text(
              '직장 정보',
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primaryColor,
                  ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _companyController,
              decoration: const InputDecoration(
                labelText: '회사명',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _positionController,
              decoration: const InputDecoration(
                labelText: '직책',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _departmentController,
              decoration: const InputDecoration(
                labelText: '부서',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _workPhoneController,
              decoration: const InputDecoration(
                labelText: '직장 전화번호',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.phone,
            ),

            const SizedBox(height: 24),
            FilledButton(
              onPressed: _submitting ? null : _submit,
              child: _submitting
                  ? const SizedBox(
                      height: 24,
                      width: 24,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('저장'),
            ),
          ],
        ),
      ),
    );
  }
}
