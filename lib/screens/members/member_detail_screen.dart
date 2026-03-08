import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../providers/member_list_provider.dart';
import '../../theme/app_theme.dart';

/// 회원 상세 화면
class MemberDetailScreen extends ConsumerWidget {
  const MemberDetailScreen({super.key, required this.memberId});
  final String memberId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncMember = ref.watch(memberDetailProvider(memberId));

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('회원 정보'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: asyncMember.when(
        data: (member) {
          if (member == null) {
            return const Center(child: Text('회원을 찾을 수 없습니다.'));
          }
          return _buildBody(context, member);
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Text('오류: $e',
              style: const TextStyle(color: AppTheme.errorColor)),
        ),
      ),
    );
  }

  Widget _buildBody(BuildContext context, Map<String, dynamic> member) {
    final name = member['name'] as String? ?? '';
    final email = member['email'] as String? ?? '';
    final phone = member['phone'] as String? ?? '';
    final address = member['address'] as String? ?? '';
    final profileImage = member['profile_image'] as String?;
    final role = member['role'] as String? ?? 'member';
    final birthDate = member['birth_date'] as String?;
    final gender = member['gender'] as String?;
    final company = member['company'] as String? ?? '';
    final position = member['position'] as String? ?? '';
    final department = member['department'] as String? ?? '';
    final workPhone = member['work_phone'] as String? ?? '';
    final createdRaw = member['created_at'] as String?;

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
          CircleAvatar(
            radius: 48,
            backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
            backgroundImage:
                profileImage != null ? NetworkImage(profileImage) : null,
            child: profileImage == null
                ? Text(
                    name.isNotEmpty ? name[0] : '?',
                    style: const TextStyle(
                      fontSize: 36,
                      color: AppTheme.primaryColor,
                      fontWeight: FontWeight.bold,
                    ),
                  )
                : null,
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
              if (email.isNotEmpty)
                _DetailRow(icon: Icons.email, label: '이메일', value: email),
              if (phone.isNotEmpty)
                _DetailRow(
                  icon: Icons.phone,
                  label: '연락처',
                  value: phone,
                  onLongPress: () => _copyToClipboard(context, phone),
                ),
              if (address.isNotEmpty)
                _DetailRow(
                    icon: Icons.location_on, label: '주소', value: address),
              if (gender != null)
                _DetailRow(
                  icon: Icons.person,
                  label: '성별',
                  value: gender == 'male' ? '남성' : '여성',
                ),
              if (birthDate != null)
                _DetailRow(
                    icon: Icons.cake, label: '생년월일', value: birthDate),
              if (createdRaw != null)
                _DetailRow(
                  icon: Icons.calendar_today,
                  label: '가입일',
                  value: DateFormat('yyyy.MM.dd')
                      .format(DateTime.parse(createdRaw)),
                ),
            ],
          ),

          // 직장 정보
          if (hasWorkInfo) ...[
            const SizedBox(height: 12),
            _SectionCard(
              title: '직장 정보',
              children: [
                if (company.isNotEmpty)
                  _DetailRow(
                      icon: Icons.business, label: '회사', value: company),
                if (position.isNotEmpty)
                  _DetailRow(
                      icon: Icons.badge, label: '직책', value: position),
                if (department.isNotEmpty)
                  _DetailRow(
                      icon: Icons.groups, label: '부서', value: department),
                if (workPhone.isNotEmpty)
                  _DetailRow(
                    icon: Icons.phone_in_talk,
                    label: '직장 전화',
                    value: workPhone,
                    onLongPress: () => _copyToClipboard(context, workPhone),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  void _copyToClipboard(BuildContext context, String text) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('$text 복사됨'), duration: const Duration(seconds: 1)),
    );
  }
}

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

class _DetailRow extends StatelessWidget {
  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
    this.onLongPress,
  });
  final IconData icon;
  final String label;
  final String value;
  final VoidCallback? onLongPress;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onLongPress: onLongPress,
      child: Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Row(
          children: [
            Icon(icon, size: 20, color: AppTheme.textSecondary),
            const SizedBox(width: 12),
            SizedBox(
              width: 64,
              child: Text(
                label,
                style: const TextStyle(
                    color: AppTheme.textSecondary, fontSize: 13),
              ),
            ),
            Expanded(
              child: Text(value, style: Theme.of(context).textTheme.bodyMedium),
            ),
          ],
        ),
      ),
    );
  }
}
