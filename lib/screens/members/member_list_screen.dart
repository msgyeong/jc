import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../providers/member_list_provider.dart';
import '../../theme/app_theme.dart';

/// 회원 목록 (검색 포함)
class MemberListScreen extends ConsumerStatefulWidget {
  const MemberListScreen({super.key});

  @override
  ConsumerState<MemberListScreen> createState() => _MemberListScreenState();
}

class _MemberListScreenState extends ConsumerState<MemberListScreen> {
  final _searchController = TextEditingController();
  bool _showSearch = false;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSearch(String query) {
    ref.read(memberListProvider.notifier).search(query);
  }

  @override
  Widget build(BuildContext context) {
    final listAsync = ref.watch(memberListProvider);

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: _showSearch
            ? TextField(
                controller: _searchController,
                autofocus: true,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  hintText: '이름 검색...',
                  hintStyle: TextStyle(color: Colors.white54),
                  border: InputBorder.none,
                ),
                onSubmitted: _onSearch,
              )
            : const Text('회원'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: Icon(_showSearch ? Icons.close : Icons.search),
            onPressed: () {
              setState(() {
                _showSearch = !_showSearch;
                if (!_showSearch) {
                  _searchController.clear();
                  ref.read(memberListProvider.notifier).search('');
                }
              });
            },
          ),
        ],
      ),
      body: listAsync.when(
        data: (members) {
          if (members.isEmpty) {
            return const Center(child: Text('회원이 없습니다.'));
          }
          return RefreshIndicator(
            onRefresh: () => ref.read(memberListProvider.notifier).load(),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: members.length,
              itemBuilder: (context, index) {
                final m = members[index];
                return _MemberCard(member: m);
              },
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Text('회원 목록을 불러올 수 없습니다.',
              style: TextStyle(color: AppTheme.errorColor)),
        ),
      ),
    );
  }
}

class _MemberCard extends StatelessWidget {
  const _MemberCard({required this.member});
  final Map<String, dynamic> member;

  @override
  Widget build(BuildContext context) {
    final name = member['name'] as String? ?? '';
    final role = member['role'] as String? ?? 'member';
    final phone = member['phone'] as String? ?? '';
    final profileImage = member['profile_image'] as String?;

    String roleLabel = '';
    if (role == 'super_admin') {
      roleLabel = '총괄관리자';
    } else if (role == 'admin') {
      roleLabel = '관리자';
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
          backgroundImage:
              profileImage != null ? NetworkImage(profileImage) : null,
          child: profileImage == null
              ? Text(
                  name.isNotEmpty ? name[0] : '?',
                  style: const TextStyle(
                    color: AppTheme.primaryColor,
                    fontWeight: FontWeight.bold,
                  ),
                )
              : null,
        ),
        title: Row(
          children: [
            Text(name),
            if (roleLabel.isNotEmpty) ...[
              const SizedBox(width: 6),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppTheme.accentColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  roleLabel,
                  style: TextStyle(
                    fontSize: 11,
                    color: AppTheme.accentColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ],
        ),
        subtitle: phone.isNotEmpty ? Text(phone) : null,
        trailing: const Icon(Icons.chevron_right, color: AppTheme.textSecondary),
        onTap: () => context.push('/home/members/${member['id']}'),
      ),
    );
  }
}
