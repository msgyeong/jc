import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../providers/post_list_provider.dart';
import '../../services/post_service.dart';
import '../../theme/app_theme.dart';

class PostEditScreen extends ConsumerStatefulWidget {
  const PostEditScreen({super.key, required this.postId});
  final String postId;

  @override
  ConsumerState<PostEditScreen> createState() => _PostEditScreenState();
}

class _PostEditScreenState extends ConsumerState<PostEditScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _contentController = TextEditingController();
  bool _isPinned = false;
  bool _saving = false;
  bool _loaded = false;
  String _category = 'general';

  @override
  void initState() {
    super.initState();
    _loadPost();
  }

  Future<void> _loadPost() async {
    final post = await PostService.getById(widget.postId);
    if (post != null && mounted) {
      setState(() {
        _titleController.text = post.title;
        _contentController.text = post.content;
        _isPinned = post.isPinned;
        _category = post.category;
        _loaded = true;
      });
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  bool get _isNotice => _category == 'notice';

  @override
  Widget build(BuildContext context) {
    if (!_loaded) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('게시글 수정'),
          backgroundColor: AppTheme.primaryColor,
          foregroundColor: Colors.white,
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('게시글 수정'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        actions: [
          TextButton(
            onPressed: _saving ? null : _submit,
            child: _saving
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white))
                : const Text('저장',
                    style: TextStyle(
                        color: Colors.white, fontWeight: FontWeight.w600)),
          ),
        ],
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
                hintText: '제목을 입력하세요',
              ),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? '제목을 입력해주세요' : null,
              maxLength: 100,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _contentController,
              decoration: const InputDecoration(
                labelText: '내용',
                hintText: '내용을 입력하세요',
                alignLabelWithHint: true,
              ),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? '내용을 입력해주세요' : null,
              maxLines: 12,
              minLines: 6,
            ),
            if (_isNotice) ...[
              const SizedBox(height: 16),
              SwitchListTile(
                title: const Text('상단 고정'),
                subtitle: const Text('이 공지를 목록 상단에 고정합니다'),
                value: _isPinned,
                onChanged: (v) => setState(() => _isPinned = v),
                activeColor: AppTheme.primaryColor,
                contentPadding: EdgeInsets.zero,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    try {
      await PostService.update(
        id: widget.postId,
        title: _titleController.text.trim(),
        content: _contentController.text.trim(),
        category: _category,
        isPinned: _isPinned,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('게시글이 수정되었습니다.')),
        );
        ref.read(noticePostListProvider.notifier).load();
        ref.read(generalPostListProvider.notifier).load();
        ref.invalidate(postDetailProvider(widget.postId));
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('수정 실패: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }
}
