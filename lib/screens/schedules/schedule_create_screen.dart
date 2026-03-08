import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../providers/schedule_list_provider.dart';
import '../../services/schedule_service.dart';
import '../../theme/app_theme.dart';

const _categoryOptions = <String, String>{
  'event': '행사',
  'meeting': '정기회의',
  'training': '교육',
  'holiday': '공휴일',
  'other': '기타',
};

/// 일정 작성
class ScheduleCreateScreen extends ConsumerStatefulWidget {
  const ScheduleCreateScreen({super.key});

  @override
  ConsumerState<ScheduleCreateScreen> createState() =>
      _ScheduleCreateScreenState();
}

class _ScheduleCreateScreenState extends ConsumerState<ScheduleCreateScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _locationController = TextEditingController();
  final _descriptionController = TextEditingController();

  DateTime _startDate = DateTime.now();
  TimeOfDay? _startTime;
  DateTime? _endDate;
  TimeOfDay? _endTime;
  String _category = 'event';
  bool _submitting = false;

  @override
  void dispose() {
    _titleController.dispose();
    _locationController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _pickDate({required bool isStart}) async {
    final initial = isStart ? _startDate : (_endDate ?? _startDate);
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
    );
    if (picked != null) {
      setState(() {
        if (isStart) {
          _startDate = picked;
          if (_endDate != null && _endDate!.isBefore(picked)) {
            _endDate = picked;
          }
        } else {
          _endDate = picked;
        }
      });
    }
  }

  Future<void> _pickTime({required bool isStart}) async {
    final initial = isStart
        ? (_startTime ?? TimeOfDay.now())
        : (_endTime ?? _startTime ?? TimeOfDay.now());
    final picked = await showTimePicker(
      context: context,
      initialTime: initial,
    );
    if (picked != null) {
      setState(() {
        if (isStart) {
          _startTime = picked;
        } else {
          _endTime = picked;
        }
      });
    }
  }

  String _buildIsoDate(DateTime date, TimeOfDay? time) {
    if (time != null) {
      return DateTime(date.year, date.month, date.day, time.hour, time.minute)
          .toIso8601String();
    }
    return date.toIso8601String();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _submitting = true);
    try {
      final id = await ScheduleService.create(
        title: _titleController.text.trim(),
        startDate: _buildIsoDate(_startDate, _startTime),
        endDate: _endDate != null ? _buildIsoDate(_endDate!, _endTime) : null,
        location: _locationController.text.trim(),
        description: _descriptionController.text.trim(),
        category: _category,
      );
      ref.read(scheduleListProvider.notifier).load();
      if (mounted) context.go('/home/schedule/$id');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('일정 등록'),
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
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? '제목을 입력하세요.' : null,
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _category,
              decoration: const InputDecoration(
                labelText: '분류',
                border: OutlineInputBorder(),
              ),
              items: _categoryOptions.entries
                  .map((e) =>
                      DropdownMenuItem(value: e.key, child: Text(e.value)))
                  .toList(),
              onChanged: (v) {
                if (v != null) setState(() => _category = v);
              },
            ),
            const SizedBox(height: 16),
            _DateTimeField(
              label: '시작일',
              date: _startDate,
              time: _startTime,
              onTapDate: () => _pickDate(isStart: true),
              onTapTime: () => _pickTime(isStart: true),
            ),
            const SizedBox(height: 16),
            _DateTimeField(
              label: '종료일 (선택)',
              date: _endDate,
              time: _endTime,
              onTapDate: () => _pickDate(isStart: false),
              onTapTime: () => _pickTime(isStart: false),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _locationController,
              decoration: const InputDecoration(
                labelText: '장소',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _descriptionController,
              decoration: const InputDecoration(
                labelText: '상세 내용',
                border: OutlineInputBorder(),
                alignLabelWithHint: true,
              ),
              maxLines: 6,
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
                  : const Text('등록'),
            ),
          ],
        ),
      ),
    );
  }
}

class _DateTimeField extends StatelessWidget {
  const _DateTimeField({
    required this.label,
    this.date,
    this.time,
    required this.onTapDate,
    required this.onTapTime,
  });
  final String label;
  final DateTime? date;
  final TimeOfDay? time;
  final VoidCallback onTapDate;
  final VoidCallback onTapTime;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          flex: 3,
          child: InkWell(
            onTap: onTapDate,
            child: InputDecorator(
              decoration: InputDecoration(
                labelText: label,
                border: const OutlineInputBorder(),
                suffixIcon: const Icon(Icons.calendar_today, size: 20),
              ),
              child: Text(
                date != null
                    ? DateFormat('yyyy.MM.dd (E)', 'ko_KR').format(date!)
                    : '날짜 선택',
                style: TextStyle(
                  color: date != null ? null : AppTheme.textSecondary,
                ),
              ),
            ),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          flex: 2,
          child: InkWell(
            onTap: onTapTime,
            child: InputDecorator(
              decoration: const InputDecoration(
                labelText: '시간',
                border: OutlineInputBorder(),
                suffixIcon: Icon(Icons.access_time, size: 20),
              ),
              child: Text(
                time != null ? time!.format(context) : '시간 선택',
                style: TextStyle(
                  color: time != null ? null : AppTheme.textSecondary,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
