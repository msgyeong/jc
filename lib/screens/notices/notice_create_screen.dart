import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../providers/notice_create_provider.dart';
import '../../providers/notice_list_provider.dart';
import '../../theme/app_theme.dart';

/// 공지사항 작성 (제목, 본문, 고정 공지, 참석자 조사 옵션)
class NoticeCreateScreen extends ConsumerStatefulWidget {
  const NoticeCreateScreen({super.key});

  @override
  ConsumerState<NoticeCreateScreen> createState() => _NoticeCreateScreenState();
}

class _NoticeCreateScreenState extends ConsumerState<NoticeCreateScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _contentController = TextEditingController();
  bool _isPinned = false;
  bool _hasAttendance = false;

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final title = _titleController.text.trim();
    final content = _contentController.text.trim();
    final result = await ref.read(noticeCreateProvider.notifier).submit(
          title: title,
          content: content,
          isPinned: _isPinned,
          hasAttendance: _hasAttendance,
        );
    if (!context.mounted) return;
    if (result.success && result.noticeId != null) {
      ref.read(noticeListProvider.notifier).load();
      context.go('/home/notices/${result.noticeId}');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result.error ?? '작성에 실패했습니다.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final createState = ref.watch(noticeCreateProvider);

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('공지 작성'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _titleController,
              decoration: const InputDecoration(
                labelText: '제목',
                border: OutlineInputBorder(),
              ),
              textCapitalization: TextCapitalization.none,
              validator: (v) {
                if (v == null || v.trim().isEmpty) return '제목을 입력하세요.';
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _contentController,
              decoration: const InputDecoration(
                labelText: '내용',
                border: OutlineInputBorder(),
                alignLabelWithHint: true,
              ),
              maxLines: 8,
              validator: (v) {
                if (v == null || v.trim().isEmpty) return '내용을 입력하세요.';
                return null;
              },
            ),
            const SizedBox(height: 16),
            CheckboxListTile(
              value: _isPinned,
              onChanged: (v) => setState(() => _isPinned = v ?? false),
              title: const Text('상단 고정'),
              controlAffinity: ListTileControlAffinity.leading,
            ),
            CheckboxListTile(
              value: _hasAttendance,
              onChanged: (v) => setState(() => _hasAttendance = v ?? false),
              title: const Text('참석자 조사 활성화'),
              controlAffinity: ListTileControlAffinity.leading,
            ),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: createState.isLoading ? null : _submit,
              child: createState.isLoading
                  ? const SizedBox(
                      height: 24,
                      width: 24,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('등록'),
            ),
          ],
        ),
      ),
    );
  }
}
