import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../models/notice_model.dart';
import '../../providers/notice_detail_provider.dart';
import '../../providers/notice_list_provider.dart';
import '../../services/notice_service.dart';
import '../../theme/app_theme.dart';

/// 수정용 공지 데이터 (조회수 증가 없이)
final noticeEditFormProvider =
    FutureProvider.family<NoticeModel?, String>((ref, id) async {
  return NoticeService.getById(id);
});

/// 공지사항 수정 화면
class NoticeEditScreen extends ConsumerStatefulWidget {
  const NoticeEditScreen({super.key, required this.noticeId});

  final String noticeId;

  @override
  ConsumerState<NoticeEditScreen> createState() => _NoticeEditScreenState();
}

class _NoticeEditScreenState extends ConsumerState<NoticeEditScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _titleController;
  late TextEditingController _contentController;
  bool _isPinned = false;
  bool _hasAttendance = false;
  bool _loaded = false;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController();
    _contentController = TextEditingController();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  void _applyNotice(NoticeModel n) {
    _titleController.text = n.title;
    _contentController.text = n.content;
    _isPinned = n.isPinned;
    _hasAttendance = n.hasAttendance;
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final title = _titleController.text.trim();
    final content = _contentController.text.trim();
    try {
      await NoticeService.update(
        id: widget.noticeId,
        title: title,
        content: content,
        isPinned: _isPinned,
        hasAttendance: _hasAttendance,
      );
      ref.invalidate(noticeDetailProvider(widget.noticeId));
      ref.read(noticeListProvider.notifier).load();
      if (!context.mounted) return;
      context.go('/home/notices/${widget.noticeId}');
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('수정 실패: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final asyncNotice = ref.watch(noticeEditFormProvider(widget.noticeId));

    return asyncNotice.when(
      data: (notice) {
        if (notice == null) {
          return Scaffold(
            appBar: AppBar(title: const Text('공지 수정')),
            body: const Center(child: Text('공지를 찾을 수 없습니다.')),
          );
        }
        if (!_loaded) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            _applyNotice(notice);
            setState(() => _loaded = true);
          });
        }

        return Scaffold(
          backgroundColor: AppTheme.backgroundColor,
          appBar: AppBar(
            title: const Text('공지 수정'),
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
                  onPressed: _submit,
                  child: const Text('저장'),
                ),
              ],
            ),
          ),
        );
      },
      loading: () => Scaffold(
        appBar: AppBar(title: const Text('공지 수정')),
        body: const Center(child: CircularProgressIndicator()),
      ),
      error: (e, _) => Scaffold(
        appBar: AppBar(title: const Text('공지 수정')),
        body: Center(child: Text('오류: $e')),
      ),
    );
  }
}
