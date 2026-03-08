import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../providers/post_list_provider.dart';
import '../../services/post_service.dart';

// ── 디자인 시스템 색상 ──────────────────────────────────
const _kPrimary = Color(0xFF1F4FD8);
const _kBackground = Color(0xFFF9FAFB);
const _kText = Color(0xFF111827);
const _kSubText = Color(0xFF6B7280);
const _kDivider = Color(0xFFE5E7EB);

const int _kMaxImages = 5;

class PostCreateScreen extends ConsumerStatefulWidget {
  const PostCreateScreen({super.key, required this.category});
  final String category;

  @override
  ConsumerState<PostCreateScreen> createState() => _PostCreateScreenState();
}

class _PostCreateScreenState extends ConsumerState<PostCreateScreen> {
  final _titleController = TextEditingController();
  final _contentController = TextEditingController();
  bool _isPinned = false;
  bool _saving = false;
  final List<XFile> _pickedImages = [];

  bool get _isNotice => widget.category == 'notice';
  bool get _canSubmit =>
      _titleController.text.trim().isNotEmpty &&
      _contentController.text.trim().isNotEmpty &&
      !_saving;

  @override
  void initState() {
    super.initState();
    _titleController.addListener(() => setState(() {}));
    _contentController.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: _kPrimary,
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text('글쓰기'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: TextButton(
              onPressed: _canSubmit ? _submit : null,
              child: _saving
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white),
                    )
                  : Text(
                      '등록',
                      style: TextStyle(
                        color: _canSubmit
                            ? Colors.white
                            : Colors.white.withValues(alpha: 0.4),
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
            ),
          ),
        ],
      ),
      body: GestureDetector(
        onTap: () => FocusScope.of(context).unfocus(),
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          children: [
            // ── 제목 필드 ──
            TextField(
              controller: _titleController,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: _kText,
              ),
              decoration: const InputDecoration(
                hintText: '제목을 입력하세요',
                hintStyle: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w400,
                  color: _kSubText,
                ),
                border: UnderlineInputBorder(
                  borderSide: BorderSide(color: _kDivider),
                ),
                enabledBorder: UnderlineInputBorder(
                  borderSide: BorderSide(color: _kDivider),
                ),
                focusedBorder: UnderlineInputBorder(
                  borderSide: BorderSide(color: _kPrimary, width: 2),
                ),
                filled: false,
                contentPadding:
                    EdgeInsets.symmetric(vertical: 12),
              ),
              maxLength: 100,
              buildCounter: (_, {required currentLength, required isFocused, maxLength}) =>
                  null,
            ),
            const SizedBox(height: 16),

            // ── 내용 필드 ──
            TextField(
              controller: _contentController,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w400,
                color: _kText,
                height: 1.6,
              ),
              decoration: const InputDecoration(
                hintText: '내용을 입력하세요',
                hintStyle: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w400,
                  color: _kSubText,
                ),
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                filled: false,
                contentPadding: EdgeInsets.zero,
              ),
              maxLines: null,
              minLines: 8,
              textAlignVertical: TextAlignVertical.top,
            ),
            const SizedBox(height: 20),

            // ── 이미지 섹션 ──
            _buildImageSection(),

            // ── 공지 옵션 ──
            if (_isNotice) ...[
              const SizedBox(height: 24),
              const Divider(color: _kDivider),
              const SizedBox(height: 8),
              const Text(
                '공지 옵션',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: _kSubText,
                ),
              ),
              const SizedBox(height: 4),
              SwitchListTile(
                title: const Text(
                  '상단 고정',
                  style: TextStyle(fontSize: 15, color: _kText),
                ),
                subtitle: const Text(
                  '이 공지를 목록 상단에 고정합니다',
                  style: TextStyle(fontSize: 13, color: _kSubText),
                ),
                value: _isPinned,
                onChanged: (v) => setState(() => _isPinned = v),
                activeColor: _kPrimary,
                contentPadding: EdgeInsets.zero,
              ),
            ],
          ],
        ),
      ),
    );
  }

  // ── 이미지 섹션 ────────────────────────────────────────

  Widget _buildImageSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Text(
              '사진',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: _kSubText,
              ),
            ),
            const Spacer(),
            Text(
              '(${_pickedImages.length}/$_kMaxImages)',
              style: const TextStyle(fontSize: 13, color: _kSubText),
            ),
          ],
        ),
        const SizedBox(height: 8),
        SizedBox(
          height: 80,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              // 선택된 이미지 썸네일
              ..._pickedImages.asMap().entries.map((entry) {
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: Stack(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.network(
                          entry.value.path,
                          width: 80,
                          height: 80,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            width: 80,
                            height: 80,
                            color: _kBackground,
                            child: const Icon(Icons.image,
                                color: _kSubText, size: 32),
                          ),
                        ),
                      ),
                      Positioned(
                        top: 2,
                        right: 2,
                        child: GestureDetector(
                          onTap: () => setState(
                              () => _pickedImages.removeAt(entry.key)),
                          child: Container(
                            width: 20,
                            height: 20,
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.6),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.close,
                                size: 14, color: Colors.white),
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }),
              // 추가 버튼
              if (_pickedImages.length < _kMaxImages)
                GestureDetector(
                  onTap: _pickImage,
                  child: Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: _kBackground,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: _kDivider,
                        style: BorderStyle.solid,
                      ),
                    ),
                    child: const Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.camera_alt_outlined,
                            size: 24, color: _kSubText),
                        SizedBox(height: 4),
                        Text(
                          '추가',
                          style: TextStyle(fontSize: 11, color: _kSubText),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }

  // ── 이미지 선택 ────────────────────────────────────────

  Future<void> _pickImage() async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.camera_alt, color: _kPrimary),
                title: const Text('카메라'),
                onTap: () => Navigator.pop(ctx, ImageSource.camera),
              ),
              ListTile(
                leading: const Icon(Icons.photo_library, color: _kPrimary),
                title: const Text('갤러리'),
                onTap: () => Navigator.pop(ctx, ImageSource.gallery),
              ),
            ],
          ),
        ),
      ),
    );

    if (source == null) return;

    final picker = ImagePicker();
    final picked = await picker.pickImage(source: source, imageQuality: 80);
    if (picked != null && _pickedImages.length < _kMaxImages) {
      setState(() => _pickedImages.add(picked));
    }
  }

  // ── 등록 ───────────────────────────────────────────────

  Future<void> _submit() async {
    if (!_canSubmit) return;
    setState(() => _saving = true);

    try {
      // TODO: 이미지 업로드 (Cloudinary) 연동 시 URL 변환 필요
      await PostService.create(
        title: _titleController.text.trim(),
        content: _contentController.text.trim(),
        category: widget.category,
        isPinned: _isPinned,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('게시글이 등록되었습니다.')),
        );
        if (_isNotice) {
          ref.read(noticePostListProvider.notifier).load();
        } else {
          ref.read(generalPostListProvider.notifier).load();
        }
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('등록 실패: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }
}
